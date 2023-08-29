#pragma once
#include "scene.h"


using namespace std;

class Geometry;

// Note: you can put kd-tree here


class splitPlane {
public:

    int axis;
    double position;
    bool isLeft = true;
    int leftCount;
    int rightCount;
    bool operator< (const splitPlane &other) const {
        return position < other.position;
    }
    BoundingBox leftBox;
    BoundingBox rightBox;

};


class Node {
public:
    bool isRoot = false;
    int axis;
    double position;
    Node* leftChild;
    Node* rightChild;
    std::vector<Geometry*> objList;
    bool isLeaf = false;
    BoundingBox leftBox;
    BoundingBox rightBox;
};

Node* buildKdTree(std::vector<Geometry*> objects,BoundingBox bb, int depth, int maxLeafSize);

splitPlane findBestPlane(std::vector<Geometry*> objects, BoundingBox bb);

bool findIntersection(ray &r, isect &i, double tmin, double tmax, Node* node);
