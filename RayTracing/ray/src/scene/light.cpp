#include <cmath>
#include <iostream>

#include "light.h"
#include "material.h"
#include "ray.h"
#include <glm/glm.hpp>
#include <glm/gtx/io.hpp>


using namespace std;

glm::dvec3 position = position;

double DirectionalLight::distanceAttenuation(const glm::dvec3& P) const
{
	// distance to light is infinite, so f(di) goes to 0.  Return 1.
	return 1.0;
}


glm::dvec3 DirectionalLight::shadowAttenuation(const ray& r, const glm::dvec3& p) const
{
	// YOUR CODE HERE:
	// You should implement shadow-handling code here.

	//return glm::dvec3(1,1,1);
	glm::dvec3 direction = getDirection(p);
	const glm::dvec3& pos = p + (r.getDirection() * -1.0 * (RAY_EPSILON));
	ray shadow(pos, direction, glm::dvec3(1,1,1), ray::VISIBILITY);
	
	isect shadowintersect;
	if(scene->intersect(shadow, shadowintersect)){
		return glm::dvec3(0.0, 0.0, 0.0);
	}

	return glm::dvec3(1,1,1);

	
}

glm::dvec3 DirectionalLight::getColor() const
{
	return color;
}

glm::dvec3 DirectionalLight::getDirection(const glm::dvec3& P) const
{
	return -orientation;
}

double PointLight::distanceAttenuation(const glm::dvec3& P) const
{

	// YOUR CODE HERE
	//return 1.0;
	// You'll need to modify this method to attenuate the intensity 
	// of the light based on the distance between the source and the 
	// point P.  For now, we assume no attenuation and just return 1.0
	double distance = glm::length(P - position);
	double functionVal = 1.0 / (constantTerm + (linearTerm * distance) + (glm::pow(distance, 2) * quadraticTerm));
	return glm::min(1.0, functionVal);
}

glm::dvec3 PointLight::getColor() const
{
	return color;
}

glm::dvec3 PointLight::getDirection(const glm::dvec3& P) const
{
	return glm::normalize(position - P);
}


glm::dvec3 PointLight::shadowAttenuation(const ray& r, const glm::dvec3& p) const
{
	// YOUR CODE HERE:
	// You should implement shadow-handling code here.
	glm::dvec3 direction;
	direction = glm::normalize(position - p);
	const glm::dvec3& pos = p + (r.getDirection() * -1.0 * (RAY_EPSILON));
	ray shadow(pos, direction, glm::dvec3(1,1,1), ray::VISIBILITY);
	
	isect shadowintersect;
	if(scene->intersect(shadow, shadowintersect)){
		double t = shadowintersect.getT();
	
		//if vector from point to intersection < point to light, then we are in shadow
		double tprime = glm::length(position - p);
		if(t < tprime) {
			return glm::dvec3(0.0, 0.0, 0.0);
		} else {
			return glm::dvec3(1.0, 1.0, 1.0);
		}
	}
	
	return glm::dvec3(1,1,1);
}

#define VERBOSE 0

