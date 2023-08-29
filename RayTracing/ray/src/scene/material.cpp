#include "material.h"
#include "../ui/TraceUI.h"
#include "light.h"
#include "ray.h"
#include "scene.h"
extern TraceUI* traceUI;

#include <glm/gtx/io.hpp>
#include <iostream>
#include "../fileio/images.h"

using namespace std;
extern bool debugMode;

Material::~Material()
{
}

// Apply the phong model to this point on the surface of the object, returning
// the color of that point.
glm::dvec3 Material::shade(Scene* scene, const ray& r, const isect& i) const
{

	glm::dvec3 color = ke(i) + ka(i)*(scene->ambient());
	vector<Light*>::iterator light;
	double t = i.getT();
	glm::dvec3 Q = r.at(t);
	for ( const auto& pLight : scene->getAllLights() )
	{
		Light* curLight = pLight.get();
		glm::dvec3 incidentVec = curLight->getDirection(Q);

		glm::dvec3 atten = curLight->distanceAttenuation(Q) * curLight->shadowAttenuation(r, Q);

		double diff = glm::dot(incidentVec, i.getN());
		if(diff < 0){
			diff = 0;
		}
		glm::dvec3 diffVec = kd(i) * diff;

		glm::dvec3 reflection = incidentVec - (2.0 * glm::dot(i.getN(), incidentVec) * i.getN());
		reflection = glm::normalize(reflection);
		
		Camera& c = scene->getCamera();
		glm::dvec3 vecV = glm::normalize(Q - c.getEye());
		double spec = glm::dot(reflection, vecV);
		if(spec < 0){
			spec = 0;
		}

		glm::dvec3 specVec = ks(i) * (glm::pow(spec, shininess(i)));


		color = color + curLight->getColor() * atten * (diffVec + specVec);
	
	}

	return color;


	// For now, this method just returns the diffuse color of the object.
	// This gives a single matte color for every distinct surface in the
	// scene, and that's it.  Simple, but enough to get you started.
	// (It's also inconsistent with the phong model...)

	// Your mission is to fill in this method with the rest of the phong
	// shading model, including the contributions of all the light sources.
	// You will need to call both distanceAttenuation() and
	// shadowAttenuation()
	// somewhere in your code in order to compute shadows and light falloff.
	//	if( debugMode )
	//		std::cout << "Debugging Phong code..." << std::endl;

	// When you're iterating through the lights,
	// you'll want to use code that looks something
	// like this:
	//
	// for ( const auto& pLight : scene->getAllLights() )
	// {
	//              // pLight has type unique_ptr<Light>
	// 		.
	// 		.
	// 		.
	// }
	
}

TextureMap::TextureMap(string filename)
{
	data = readImage(filename.c_str(), width, height);
	if (data.empty()) {
		width = 0;
		height = 0;
		string error("Unable to load texture map '");
		error.append(filename);
		error.append("'.");
		throw TextureMapException(error);
	}
}

glm::dvec3 TextureMap::getMappedValue(const glm::dvec2& coord) const
{
	// YOUR CODE HERE
	//
	// In order to add texture mapping support to the
	// raytracer, you need to implement this function.
	// What this function should do is convert from
	// parametric space which is the unit square
	// [0, 1] x [0, 1] in 2-space to bitmap coordinates,
	// and use these to perform bilinear interpolation
	// of the values.

	//cout << coord[0];
	double coordX = coord.x;
	double coordY = coord.y;
	if(coordX > 1){
		coordX = 1.0;
	}
	if(coordY > 1){
		coordY = 1.0;
	}


	double x = coordX * width;
	double y = coordY * height;

	int x1 = floor(x);
	int x2 = x + 1;
	int y1 = floor(y);
	int y2 = y + 1;

	//Get Q Points
	glm::dvec3 Q12 = getPixelAt(x1, y2);
	glm::dvec3 Q11 = getPixelAt(x1, y1);
	glm::dvec3 Q21 = getPixelAt(x2, y1);
	glm::dvec3 Q22 = getPixelAt(x2, y2);

	//Get R Points
	glm::dvec3 R1 = (Q11 * ((x2 - x) / (x2 - x1)) )  +  (Q21 * ((x - x1) / (x2 - x1)));
	glm::dvec3 R2 = (Q12 * ((x2 - x) / (x2 - x1)) )  +  (Q22 * ((x - x1) / (x2 - x1)));  

	glm::dvec3 P = R1 * ((y2 - y) / (y2 - y1)) + R2 * ((y - y1) / (y2 - y1));

	return P;
}

glm::dvec3 TextureMap::getPixelAt(int x, int y) const
{
	// YOUR CODE HERE
	//
	// In order to add texture mapping support to the
	// raytracer, you need to implement this function.


	int start = (y * width + x) * 3;
	double r = data[start] / 255.0;
	double g = data[start + 1] / 255.0;
	double b = data[start + 2] / 255.0;

	return glm::dvec3(r, g, b);
}

glm::dvec3 MaterialParameter::value(const isect& is) const
{
	if (0 != _textureMap)
		return _textureMap->getMappedValue(is.getUVCoordinates());
	else
		return _value;
}

double MaterialParameter::intensityValue(const isect& is) const
{
	if (0 != _textureMap) {
		glm::dvec3 value(
		        _textureMap->getMappedValue(is.getUVCoordinates()));
		return (0.299 * value[0]) + (0.587 * value[1]) +
		       (0.114 * value[2]);
	} else
		return (0.299 * _value[0]) + (0.587 * _value[1]) +
		       (0.114 * _value[2]);
}

//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
