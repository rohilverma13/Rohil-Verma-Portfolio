// The main ray tracer.

#pragma warning (disable: 4786)

#include "RayTracer.h"
#include "scene/light.h"
#include "scene/material.h"
#include "scene/ray.h"
#include "scene/kdTree.h"

#include "parser/Tokenizer.h"
#include "parser/Parser.h"

#include "ui/TraceUI.h"
#include <cmath>
#include <algorithm>
#include <glm/glm.hpp>
#include <glm/gtx/io.hpp>
#include <string.h> // for memset

#include <iostream>
#include <fstream>

#include <cmath>

#include "scene/scene.h"
#include "scene/kdTree.h"
#include <glm/gtx/extended_min_max.hpp>
#include <iostream>
#include <glm/gtx/io.hpp>

using namespace std;
extern TraceUI* traceUI;

// Use this variable to decide if you want to print out
// debugging messages.  Gets set in the "trace single ray" mode
// in TraceGLWindow, for example.
bool debugMode = false;

// Trace a top-level ray through pixel(i,j), i.e. normalized window coordinates (x,y),
// through the projection plane, and out into the scene.  All we do is
// enter the main ray-tracing method, getting things started by plugging
// in an initial ray weight of (0.0,0.0,0.0) and an initial recursion depth of 0.

glm::dvec3 RayTracer::trace(double x, double y)
{
	// Clear out the ray cache in the scene for debugging purposes,
	if (TraceUI::m_debug)
	{
		scene->clearIntersectCache();		
	}

	ray r(glm::dvec3(0,0,0), glm::dvec3(0,0,0), glm::dvec3(1,1,1), ray::VISIBILITY);
	scene->getCamera().rayThrough(x,y,r);
	double dummy;


	glm::dvec3 ret = traceRay(r, glm::dvec3(1.0,1.0,1.0), traceUI->getDepth(), dummy);
	ret = glm::clamp(ret, 0.0, 1.0);
	return ret;
}

glm::dvec3 RayTracer::tracePixel(int i, int j)
{
	glm::dvec3 col(0,0,0);

	if( ! sceneLoaded() ) return col;

	double x = double(i)/double(buffer_width);
	double y = double(j)/double(buffer_height);
	
	unsigned char *pixel = buffer.data() + ( i + j * buffer_width ) * 3;


	if(traceUI->aaSwitch()){
		//If anti aliasing switch is checked, perform an unweighted average on pixelSamples rays cast in each direction
		double pixelSamples = traceUI->getSuperSamples() * 1.0;
		double interval = 1.0/pixelSamples;
		for(int n = 0; n < pixelSamples; n++){
			for(int m = 0; m < pixelSamples; m++){
				col += trace(x + n*(interval/double(buffer_width)), y + m*(interval/double(buffer_height)));
			}
		}

		col = col * (1.0 / (pixelSamples * pixelSamples));
	} else {
		col = trace(x, y);
	}
	

	

	pixel[0] = (int)( 255.0 * col[0]);
	pixel[1] = (int)( 255.0 * col[1]);
	pixel[2] = (int)( 255.0 * col[2]);
	return col;
}

#define VERBOSE 0

// Do recursive ray tracing!  You'll want to insert a lot of code here
// (or places called from here) to handle reflection, refraction, etc etc.
glm::dvec3 RayTracer::traceRay(ray& r, const glm::dvec3& thresh, int depth, double& t )
{
	isect i;
	glm::dvec3 colorC;
#if VERBOSE
	std::cerr << "== current depth: " << depth << std::endl;
#endif

	if(depth <= 0){
		return glm::dvec3(0,0,0);
	}
	if(scene->intersect(r, i)) {
		// An intersection occurred!  We've got work to do.  For now,
		// this code gets the material for the surface that was intersected,
		// and asks that material to provide a color for the ray.

		// This is a great place to insert code for recursive ray tracing.
		// Instead of just returning the result of shade(), add some
		// more steps: add in the contributions from reflected and refracted
		// rays.
		
		
		const Material& m = i.getMaterial();

		colorC = m.shade(scene.get(), r, i);
		glm::dvec3 normal = i.getN(); 

		t += i.getT();
		glm::dvec3 Q = r.at(t);
		glm::dvec3 dir = r.getDirection();

		//reflection
		//wanna use an outgoing ray
		ray reflectray(r.at(i), glm::dvec3(0,0,0), glm::dvec3(1,1,1), ray::REFLECTION);
		glm::dvec3 reflectDir = r.getDirection() - (2.0 * glm::dot(i.getN(), r.getDirection()) * i.getN());
		reflectray.setDirection(reflectDir);

		colorC += m.kr(i) * traceRay(reflectray, thresh, depth - 1, t);

		glm::dvec3 trans = m.kt(i);



		double etaI;
		double etaT;
		double etaR;
		glm::dvec3 incident = glm::normalize(r.getDirection() * -1.0);
		glm::dvec3 newnormal;

		double dot = glm::dot(incident, i.getN());
		if(dot >= 0){
			//entering
			etaI = 1.0;
			etaT = m.index(i);
		} else {
			//exiting
			etaI = m.index(i);
			etaT = 1.0;
			i.setN(i.getN() * -1.0);
		}

		etaR = (double)etaI / etaT;
		dot = glm::dot(i.getN(), incident);
		double k = 1.0 - (etaR * etaR) * (1.0 - (dot * dot));
		glm::dvec3 zero = glm::dvec3(0,0,0);

		if(k >= 0){
			if(glm::all(glm::greaterThan(trans, zero))){
				glm::dvec3 refractDir = (((etaR * glm::dot(i.getN(), incident)) - glm::sqrt(k)) * i.getN()) - (etaR * incident);
				ray refractray(r.at(i), refractDir, glm::dvec3(1,1,1), ray::REFRACTION);
				colorC += trans * traceRay(refractray, thresh, depth - 1, t);
			}
		}
		
	
	} else {
		// No intersection.  This ray travels to infinity, so we color
		// it according to the background color, which in this (simple) case
		// is just black.
		//
		// FIXME: Add CubeMap support here.
		// TIPS: CubeMap object can be fetched from traceUI->getCubeMap();
		//       Check traceUI->cubeMap() to see if cubeMap is loaded
		//       and enabled.

		//If cubemap loaded, return the color of the pixel corresponding. 
		CubeMap *cm = traceUI->getCubeMap();
		if(cm){
			colorC =  cm->getColor(r);
		} else {
			colorC = glm::dvec3(0.0, 0.0, 0.0);
		}
		
	}
#if VERBOSE
	std::cerr << "== depth: " << depth+1 << " done, returning: " << colorC << std::endl;
#endif
	return colorC;
}

RayTracer::RayTracer()
	: scene(nullptr), buffer(0), thresh(0), buffer_width(0), buffer_height(0), m_bBufferReady(false)
{
}

RayTracer::~RayTracer()
{
}

void RayTracer::getBuffer( unsigned char *&buf, int &w, int &h )
{
	buf = buffer.data();
	w = buffer_width;
	h = buffer_height;
}

double RayTracer::aspectRatio()
{
	return sceneLoaded() ? scene->getCamera().getAspectRatio() : 1;
}

bool RayTracer::loadScene(const char* fn)
{
	
	ifstream ifs(fn);
	if( !ifs ) {
		string msg( "Error: couldn't read scene file " );
		msg.append( fn );
		traceUI->alert( msg );
		return false;
	}

	// Strip off filename, leaving only the path:
	string path( fn );
	if (path.find_last_of( "\\/" ) == string::npos)
		path = ".";
	else
		path = path.substr(0, path.find_last_of( "\\/" ));

	// Call this with 'true' for debug output from the tokenizer
	Tokenizer tokenizer( ifs, false );
	Parser parser( tokenizer, path );
	try {
		scene.reset(parser.parseScene());
	}
	catch( SyntaxErrorException& pe ) {
		traceUI->alert( pe.formattedMessage() );
		return false;
	} catch( ParserException& pe ) {
		string msg( "Parser: fatal exception " );
		msg.append( pe.message() );
		traceUI->alert( msg );
		return false;
	} catch( TextureMapException e ) {
		string msg( "Texture mapping exception: " );
		msg.append( e.message() );
		traceUI->alert( msg );
		return false;
	}
	
	if (!sceneLoaded())
		return false;

	// KdTree<Geometry>* kdTree;
	// kdTree = kdTree->buildKdTree();

	//assert(0);
	Node* rootNode;
	rootNode = buildKdTree(scene->getObjects(), scene->bounds(), traceUI->getMaxDepth(), traceUI->getLeafSize());
	rootNode->isRoot = true;
	scene->setKd(rootNode);

	return true;
}

void RayTracer::traceSetup(int w, int h)
{
	size_t newBufferSize = w * h * 3;
	if (newBufferSize != buffer.size()) {
		bufferSize = newBufferSize;
		buffer.resize(bufferSize);
	}
	buffer_width = w;
	buffer_height = h;
	std::fill(buffer.begin(), buffer.end(), 0);
	m_bBufferReady = true;

	/*
	 * Sync with TraceUI
	 */

	threads = traceUI->getThreads();
	block_size = traceUI->getBlockSize();
	thresh = traceUI->getThreshold();
	samples = traceUI->getSuperSamples();
	aaThresh = traceUI->getAaThreshold();

	// You can add additional GUI functionality here as necessary
}

/*
 * RayTracer::traceImage
 *
 *	Trace the image and store the pixel data in RayTracer::buffer.
 *
 *	Arguments:
 *		w:	width of the image buffer
 *		h:	height of the image buffer
 *
 */
void RayTracer::traceImage(int w, int h)
{
	// Always call traceSetup before rendering anything.
	traceSetup(w,h);
	for (int i = 0; i < w; i++){
		for (int j = 0; j < h; j++){
			tracePixel(i, j);
		}
	}
	// YOUR CODE HERE
	// FIXME: Start one or more threads for ray tracing. 
	// OpenMP is probably best "bang for buck" time spent on this task
	//
	// Alternatively traceImage can be executed asynchronously,
	//       i.e. returns IMMEDIATELY after working threads are launched.
	//
	//       An asynchronous traceImage lets the GUI update your results
	//       while rendering.
	//
	// This will require you to work with pthreads and queuing which is more involved, though
}


glm::dvec3 RayTracer::getPixel(int i, int j)
{
	unsigned char *pixel = buffer.data() + ( i + j * buffer_width ) * 3;
	return glm::dvec3((double)pixel[0]/255.0, (double)pixel[1]/255.0, (double)pixel[2]/255.0);
}

void RayTracer::setPixel(int i, int j, glm::dvec3 color)
{
	unsigned char *pixel = buffer.data() + ( i + j * buffer_width ) * 3;

	pixel[0] = (int)( 255.0 * color[0]);
	pixel[1] = (int)( 255.0 * color[1]);
	pixel[2] = (int)( 255.0 * color[2]);
}




