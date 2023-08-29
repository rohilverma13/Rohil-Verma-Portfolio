#include "cubeMap.h"
#include "ray.h"
#include "../ui/TraceUI.h"
#include "../scene/material.h"
extern TraceUI* traceUI;
#include <iostream>
#include <fstream>
using namespace std;

glm::dvec3 CubeMap::getColor(ray r) const
{
	// YOUR CODE HERE
	// FIXME: Implement Cube Map here
	//eturn glm::dvec3(0,0,0);

	glm::dvec3 dVec = (r.getDirection());
	double x = dVec.x;
	double y = dVec.y;
	double z = dVec.z;

	double xAbs = fabs(x);
	double yAbs = fabs(y);
	double zAbs = fabs(z);
	int index = 0;
	double u;
	double v;
	double max;

	if((x > 0) && (zAbs <= xAbs) && (yAbs <= xAbs)){
		//Right
		index = 0;
		u = ((z * -1.0) / xAbs + 1.0) / 2.0;
		v = (y / xAbs + 1.0) / 2.0;
	}

	if((x <= 0) && (yAbs <= xAbs) && (zAbs <= xAbs)){
		//Left
		index = 1;
		u = ((z / xAbs) + 1.0) / 2.0;
		v = ((y / xAbs) + 1.0) / 2.0;
	}

	if((y > 0) && (xAbs <= yAbs) && (zAbs <= yAbs)){
		//Top
		index = 2;
		u = ((x / yAbs) + 1.0) / 2.0;
		v = (((-1.0 * z) / yAbs) + 1.0) / 2.0;
	}

	if((y <= 0) && (zAbs <= yAbs) && (xAbs <= yAbs)){
		//Bottom
		index = 3;
		u = ((x / yAbs) + 1.0) / 2.0;
		v = ((z / yAbs) + 1.0) / 2.0;
	}

	if((z > 0) && (xAbs <= zAbs) && (yAbs <= zAbs)){
		//Front
		index = 4;
		u = ((x / zAbs) + 1.0) / 2.0;
		v = ((y / zAbs) + 1.0) / 2.0;
	}

	if((z <= 0) && (xAbs <= zAbs) && (yAbs <= zAbs)){
		//Back
		index = 5;
		u = (((-1.0 * x) / zAbs) + 1.0) / 2.0;
		v = ((y / zAbs) + 1.0) / 2.0;
	}	


	return tMap[index]->getMappedValue(glm::dvec2(u,v));
}

CubeMap::CubeMap()
{
}

CubeMap::~CubeMap()
{
}

void CubeMap::setNthMap(int n, TextureMap* m)
{
	if (m != tMap[n].get())
		tMap[n].reset(m);
}
