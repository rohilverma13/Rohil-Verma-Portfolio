export let defaultVSText = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;
    attribute vec4 aNorm;
    
    varying vec4 lightDir;
    varying vec4 normal;   
    varying vec4 vertsWorld;
 
    uniform vec4 lightPosition;
    uniform mat4 mWorld;
    uniform mat4 mView;
	uniform mat4 mProj;

    void main () {
		//  Convert vertex to camera coordinates and the NDC
        gl_Position = mProj * mView * mWorld * vec4 (vertPosition, 1.0);
        
        //  Compute light direction (world coordinates)
        lightDir = lightPosition - vec4(vertPosition, 1.0);
		
        //  Pass along the vertex normal (world coordinates)
        normal = aNorm;

        // Pass along the world coordinates of the vertices

    }
`;

// TODO: Write the fragment shader

export let defaultFSText = `
    precision mediump float;

    varying vec4 lightDir;
    varying vec4 normal;    
	
    
    void main () {  
        vec3 norm = normalize(normal.xyz);
        vec3 light = normalize(lightDir.xyz);
        float diff = max(dot(norm, light), 0.0);
        gl_FragColor = vec4(abs(normal.xyz) * diff, 1.0);
    }
`;

// TODO: floor shaders

export let floorVSText = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;
    attribute vec4 aNorm;
    
    varying vec4 lightDir;
    varying vec4 normal;   
    varying vec4 vertsWorld;
 
    uniform vec4 lightPosition;
    uniform mat4 mWorld;
    uniform mat4 mView;
	uniform mat4 mProj;

    void main () {
		//  Convert vertex to camera coordinates and the NDC
        gl_Position = mProj * mView * mWorld * vec4 (vertPosition, 1.0);
        
        //  Compute light direction (world coordinates)
        lightDir = lightPosition - vec4(vertPosition, 1.0);
		
        //  Pass along the vertex normal (world coordinates)
        normal = aNorm;

        // Pass along the world coordinates of the vertices
        vertsWorld = mWorld * vec4(vertPosition, 1.0);
    }
`;
export let floorFSText = `
    precision mediump float;

    varying vec4 lightDir;
    varying vec4 normal;
    varying vec4 vertsWorld;    
    
    void main () {  
        float a = mod(vertsWorld.x, 10.0);
        float b = mod(vertsWorld.z, 10.0);
        vec3 col;

        if(a > 5.0){
            if(b > 5.0){
                col = vec3(0.0, 0.0, 0.0);
            } else {
                col = vec3(1.0, 1.0, 1.0);
            }
            
        } else {
            if(b > 5.0){
                col = vec3(1.0, 1.0, 1.0);
            } else {
                col = vec3(0.0, 0.0, 0.0);
                
            }
        }

        vec3 norm = vec3(0.0, 1.0, 0.0);
        vec3 light = normalize(lightDir.xyz);
        float diff = max(dot(norm, light), 0.0);
        gl_FragColor = vec4(col * diff, 1.0);
    }
`;

