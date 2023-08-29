#include "kdTree.h"
#include "float.h"

#include "material.h"
#include "ray.h"
#include "scene.h"
#include "light.h"
#include "kdTree.h"
#include "../ui/TraceUI.h"
#include <glm/gtx/extended_min_max.hpp>
#include <iostream>
#include <glm/gtx/io.hpp>



Node* buildKdTree(std::vector<Geometry*> objects, BoundingBox bb, int depth, int maxLeafSize) {
       
        Node* node;


        //Base case - return leaf node
        if (objects.size() <= maxLeafSize || --depth <= 0){
           node = new Node();
           node->objList = objects;
           node->isLeaf = true;
           return node;
        }

        std::vector<Geometry*> rightList;
        std::vector<Geometry*> leftList;
        splitPlane bestPlane = findBestPlane(objects, bb);
        int axis = bestPlane.axis;
        double pos = bestPlane.position;

        //Add to left list, right list, or both.
        for(int i = 0; i < objects.size(); i++){
            
            Geometry *curObj = objects[i];
            double bMin = curObj->getBoundingBox().getMin()[axis];
            double bMax = curObj->getBoundingBox().getMax()[axis];

            if(bMin < pos){
                //add to left list
                leftList.push_back(curObj);
            } 
            if(bMax > pos){
                //add to right list
                rightList.push_back(curObj);
            }

            if(pos == bMin && pos == bMax && curObj->getNormal()[axis] < 0){
                // add to left list
                leftList.push_back(curObj);
            }

            else if(pos == bMax && pos == bMin && curObj->getNormal()[axis] >= 0){
                // add to right list
                rightList.push_back(curObj);
            }

        }

        if(rightList.size() == 0 || leftList.size() == 0){
            //return leaf node with objects list since the split did not provide any extra gain
            node = new Node();
            node->objList = objects;
            node->isLeaf = true;
            return node;

        } else {
            //return split node by recursively calling buildKdTree with the left list for the left node and the right list for the right node
            node = new Node();
            node->leftBox = bestPlane.leftBox;
            node->rightBox = bestPlane.rightBox;
            node->position = pos; 
            node->axis = axis;
            node->leftChild = buildKdTree(leftList, bestPlane.leftBox, depth--, maxLeafSize);
            node->rightChild = buildKdTree(rightList, bestPlane.rightBox, depth--, maxLeafSize);
            return node;
        }

}



splitPlane findBestPlane(std::vector<Geometry*> objects, BoundingBox bb){
    
    //Find the best split plane based on SAM criteria

    splitPlane bestPlane;
    double minSam = DBL_MAX;
    std::vector<splitPlane> candidateList;
    std::vector<splitPlane> sorted;
    for(int axis = 0; axis < 3; axis++){

        //For each axis, go through each object and create two split planes based on the min and max bounds on that axis.
        //Then, we will sort these planes by position and quickly calculate the SAM values based on area and count.

        for(int i = 0; i < objects.size(); i++){
            Geometry* curObj = objects[i];
            double bMin = curObj->getBoundingBox().getMin()[axis];
            double bMax = curObj->getBoundingBox().getMax()[axis];
            splitPlane p1;
            p1.axis = axis;
            p1.position = bMin;
            splitPlane p2;
            p2.axis = axis;
            p2.position = bMax;
            p2.isLeft = false;
            candidateList.push_back(p1);
            candidateList.push_back(p2);
        }


        //Sort candidates on this axis by position
        sorted = candidateList;
        std::sort(sorted.begin(), sorted.end());
        
        int rightCount = objects.size();
        //Go left to right and decrement right count accordingly
        for(int i = 0; i < sorted.size(); i++){
            if(!sorted[i].isLeft){
                rightCount = rightCount - 1;
            }
            sorted[i].rightCount = rightCount;
        }

        //Go right to left and decrement left count
        //Now we know both left and right count and can perform SAM calculations
        int leftCount = objects.size();
        for(int i = sorted.size() - 1; i >= 0; i--){
            if(sorted[i].isLeft){
                leftCount = leftCount - 1;
            }
            sorted[i].leftCount = leftCount;
            
            int xMax;
            int xMin;
            int yMax;
            int yMin;
            int zMax;
            int zMin;

            //Calculate left area
            xMin = bb.getMin()[0];
            xMax = bb.getMax()[0];
            yMin = bb.getMin()[1];
            yMax = bb.getMax()[1];
            zMin = bb.getMin()[2];
            zMax = bb.getMax()[2];

            if(axis == 0){
                xMax = sorted[i].position;
            }

            if(axis == 1){
                yMax = sorted[i].position;
            }

            if(axis == 2){
                zMax = sorted[i].position;
            }
            

            int width = xMax - xMin;
            int height = yMax - yMin;
            int depth = zMax - zMin;

            int leftArea = 2 * (width * height + width * depth + depth * height);

            BoundingBox leftBox = BoundingBox();
            leftBox.setMin(glm::dvec3(xMin, yMin, zMin));
            leftBox.setMax(glm::dvec3(xMax, yMax, zMax));


            //Calculate right area
            xMin = bb.getMin()[0];
            xMax = bb.getMax()[0];
            yMin = bb.getMin()[1];
            yMax = bb.getMax()[1];
            zMin = bb.getMin()[2];
            zMax = bb.getMax()[2];
            
            if(axis == 0){
                xMin = sorted[i].position;
            }

            if(axis == 1){
                yMin = sorted[i].position;
            }

            if(axis == 2){
                zMin = sorted[i].position;
            }

            width = xMax - xMin;
            height = yMax - yMin;
            depth = zMax - zMin;

            int rightArea = 2 * (width * height + width * depth + depth * height);

            BoundingBox rightBox = BoundingBox();
            rightBox.setMin(glm::dvec3(xMin, yMin, zMin));
            rightBox.setMax(glm::dvec3(xMax, yMax, zMax));

           
            //Perform SAM calculations to determine best split plane. 
            double SAM = sorted[i].leftCount * leftArea + sorted[i].rightCount * rightArea;
            if(SAM < minSam){
                sorted[i].leftBox = leftBox;
                sorted[i].rightBox = rightBox;
                minSam = SAM;
                bestPlane = sorted[i];
            }
            sorted.clear();
            candidateList.clear();
        }
    }

    
    return bestPlane;

}



bool findIntersection(ray &r, isect &i, double tmin, double tmax, Node* node){
    

    
    if(!node->isLeaf){

        //Is a split node, must check intersections with child boxes.

        double leftTMin;
        double leftTMax;
        double rightTMin;
        double rightTMax;


        bool leftIntersect = node->leftBox.intersect(r, leftTMin, leftTMax);
        bool rightIntersect = node->rightBox.intersect(r, rightTMin, rightTMax);


        //Calculate axis normal and dot product with ray direction to determine if ray is going right to left or left to right
        glm::dvec3 axisNormal = glm::dvec3(0.0, 0.0, 0.0);

        if(node->axis == 0){
            axisNormal[0] = 1.0;
        } else if(node->axis == 1){
            axisNormal[1] = 1.0;
        } else {
            axisNormal[2] = 1.0;
        }

        glm::dvec3 normalRayDirection = glm::normalize(r.getDirection());
        double dot = fabs(glm::dot(normalRayDirection, axisNormal));
        
        bool found = false;


        //Determine which child to recursively call on depending on ray direction and which boxes it hits.

        if(leftIntersect && !rightIntersect){
            //intersects left only
            if(findIntersection(r, i, leftTMin, leftTMax, node->leftChild)){
                return true;
            }

        } else if(rightIntersect && !leftIntersect){
            //intersects right only
            if(findIntersection(r, i, rightTMin, rightTMax, node->rightChild)){
                return true;
            }

        } else {
            //intersects both, must check nearest and furthers.

            if(dot < 0){
               //Moving left to right, check left first.
                if(findIntersection(r, i, leftTMin, leftTMax, node->leftChild) ){
                    found = true;
                }
                if(findIntersection(r, i, rightTMin, rightTMax, node->rightChild)){
                    found = true;
                }
            } else {
               //Moving right to left, check right first.
                if(findIntersection(r, i, rightTMin, rightTMax, node->rightChild)){
                    found = true;
                } 
                if(findIntersection(r, i, leftTMin, leftTMax, node->leftChild)){
                    found = true;
                }
            }
        } 

        return found;

    } else {
        
        //leaf node, must do narrow phase on each object.
        bool isectFound = false;
        double minT = DBL_MAX;

        //If isect i is already set, we know that another bounding box has returned a true intersection. Must compare t values to this.
        if(i.getT() != 0){
            minT = i.getT();
        }

        //Iterate through objects and find smallest t.
        for(int obj = 0; obj < node->objList.size(); obj++){
            Geometry* curObj = node->objList[obj];
            isect c_i;
            if(curObj->intersect(r, c_i)){
                if(c_i.getT() >= tmin && c_i.getT() <= tmax){
                    if(c_i.getT() < minT){
                        minT = c_i.getT();
                        i = c_i;
                        isectFound = true;
                    }
                    
                }
            }
        }
        return isectFound;
    }


}
