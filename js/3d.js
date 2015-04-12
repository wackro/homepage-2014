
if ( Detector.webgl )
	load3d();
else
	renderSimple();
	
function renderSimple() {
	document.getElementById("basic").style.visibility = "visible";
	document.getElementById('toggle3d').style.visibility = 'hidden';
	document.getElementById('basicMessage').style.visibility = 'visible';
}

// load resources then render on callback.
function load3d() {
	yepnope({
		load: ['js/three.min.js',
			'js/ShaderGodRays.js',
			'js/fjalla_one_regular.typeface.js',
			'js/stats.js'
		],
		complete: function() {
			renderToggler();
			render3d();
		}
	});
}

function renderToggler() {
	var cube, squareMesh, renderer, scene, camera;

	init();
	animate();

	function init() {
		camera = new THREE.PerspectiveCamera(20, 1, 1, 5000);
		camera.position.z = 1300;
		scene = new THREE.Scene();

		var geometry = new THREE.CubeGeometry(300, 300, 300);
		var material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			wireframe: true
		});

		cubeMesh = new THREE.Mesh(geometry, material);
		cubeMesh.visible = false;
		cubeMesh.rotation.x += 0.3;
		scene.add(cubeMesh);

		cube = new THREE.BoxHelper( cubeMesh );
		cube.material.color.set( 0xff5555 );
		scene.add( cube );
		
		var squareGeometry = new THREE.Geometry();
		squareGeometry.vertices.push(new THREE.Vector3(-140.0,  140.0, 0.0));
		squareGeometry.vertices.push(new THREE.Vector3( 140.0,  140.0, 0.0));
		squareGeometry.vertices.push(new THREE.Vector3( 140.0, -140.0, 0.0));
		squareGeometry.vertices.push(new THREE.Vector3(-140.0, -140.0, 0.0));
		
		squareGeometry.faces.push(new THREE.Face3(0, 1, 2));
		squareGeometry.faces.push(new THREE.Face3(0, 2, 3));
		
		material = new THREE.MeshBasicMaterial({ color:0xff6666, side:THREE.DoubleSide, wireframe: true });
		squareMesh = new THREE.Mesh( squareGeometry, material );				
		scene.add( squareMesh )

		renderer = new THREE.CanvasRenderer();
		renderer.setSize(40, 40);

		document.getElementById('toggle3d').appendChild(renderer.domElement);
		renderer.domElement.id = 'togglerAnimation';
		renderer.domElement.style.position = 'inherit';
		renderer.domElement.style.bottom = '12px';
		renderer.domElement.style.left = '38px';
	}

	function animate() {
		var speed = toggleHover ? 5 : 1
	
		requestAnimationFrame(animate);
		
		cube.visible = !viewing3d;
		squareMesh.visible = viewing3d;

		cubeMesh.rotation.y += 0.01 * speed;
		squareMesh.rotation.z -= 0.01 * speed;

		renderer.render(scene, camera);
	}
}

function render3d() {
	var container, stats;
	var camera, following, scene, renderer, materialDepth;
	var mainTextMesh, earthMesh, emailMesh, facebookMesh, linkedinMesh, cameraMesh, beansMesh;
	var rayVector = new THREE.Vector3(), raycaster = new THREE.Raycaster();
	var projector = new THREE.Projector();
	var sunPosition = new THREE.Vector3( 105, 55, -250 );
	var screenSpacePosition = new THREE.Vector3();
	var mouseX = 0, mouseY = 0;
	var windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;
	var height = window.innerHeight, width = window.innerWidth;
	var interactables = [];
	var time = Date.now(), slowModifier = 0.001, normalModifier = 0.005;
	var grabbing, hovering = false, socialNodesVisible = false, hoveringObject;
	var sc = 12;
	var d;
	
	// variables and functions to be controlled with dat.gui
	var variablesController = {
		bgColor: '#112266',
		lightIntensity: 0.93,
		postprocessing: true,
		hoverColor: '#cccc99',
		resetCamera: function() {
			followObject(scene, 0, 0, 0);
			camera.position.x = -80;
			camera.position.y = -1;
			camera.position.z = 140;
		},
		wideCamera: function() {
			camera.position.x = 250;
			camera.position.y = 150;
		},
		topDownCamera: function() {
			camera.position.x = 0;
			camera.position.y = 300;
			camera.position.z = 0;
		},
		followSocial: function() {
			followObject(earthMesh, 20, 20, 20);
		},
		followPhotography: function() {
			followObject(cameraMesh, 20, 20, 20);
		},
		followBeans: function() {
			followObject(beansMesh, 20, 20, 20);
		}
	};
		
	var bgColor = variablesController.bgColor;
	var lightIntensity = variablesController.lightIntensity;
	var postprocessing = { enabled : variablesController.postprocessing };
	var hoverColor = variablesController.hoverColor;
	
	// do the magic
	init();
	animate();
	
	
	// apply values from the variable controller on render
	function updateVariables() {
		renderer.setClearColor( variablesController.bgColor, 1 );
		postprocessing.godrayCombineUniforms.fGodRayIntensity.value = variablesController.lightIntensity;
		postprocessing.enabled = variablesController.postprocessing;
		hoverColor = variablesController.hoverColor;
	}
	
	function init() {
		container = document.createElement( 'div' );
		document.body.appendChild( container );

		// camera
		camera = new THREE.PerspectiveCamera( 70, window.innerWidth / height, 1, 3000 );
		camera.position.x = -80;
		camera.position.y = -1;
		camera.position.z = 140;
		camera.originalPosition = new THREE.Vector3(-80, 1, 140);

		scene = new THREE.Scene();
		following = scene;
		
		// renderer
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setSize( window.innerWidth, height );
		container.appendChild( renderer.domElement );

		renderer.sortObjects = false;

		renderer.autoClear = false;
		renderer.setClearColor( bgColor, 1 );

		renderer.domElement.id = 'mainAnimation';
		renderer.domElement.style.position = 'absolute';
		renderer.domElement.style.left = "0";
		renderer.domElement.style.top = "0";
		
		// lighting
		var pointLight = new THREE.PointLight('#ffffaa', 0.75);
		pointLight.position = sunPosition;
		scene.add(pointLight);
		var centerLight = new THREE.PointLight('#ffffaa', 0.05);
		scene.add(centerLight);
		
		// materials
		materialDepth = new THREE.MeshDepthMaterial();
		
		var mainTextMaterial = new THREE.MeshLambertMaterial({ 
			emissive: '#220505',
			color: '#ff0000',
			shading: THREE.SmoothShading
		});
		
		var materialPhotography = new THREE.MeshPhongMaterial( {
			shininess: 30,
			emissive: '#080805',
			color: '#222222',
			specular: '#ffffff',
			shading: THREE.FlatShading
		} );
		materialPhotography.originalEmissive = materialPhotography.emissive.getHex();
		
		var earthMaterial = new THREE.MeshLambertMaterial({
			map: THREE.ImageUtils.loadTexture( 'textures/earth.jpg' ),
			emissive: '#181818',
			shading: THREE.SmoothShading
		});
		earthMaterial.originalEmissive = earthMaterial.emissive.getHex();

		var materialFacebook = new THREE.MeshLambertMaterial({
			map: THREE.ImageUtils.loadTexture( 'textures/moonfb.jpg' ),
			emissive: '#181818',
			shading: THREE.SmoothShading,
			opacity: 0.0,
			visible: true
		});
		materialFacebook.originalEmissive = materialFacebook.emissive.getHex();
		
		var materialLinkedin = new THREE.MeshLambertMaterial({
			map: THREE.ImageUtils.loadTexture( 'textures/moonli.jpg' ),
			emissive: '#181818',
			shading: THREE.SmoothShading
		});
		materialLinkedin.originalEmissive = materialLinkedin.emissive.getHex();
		
		var materialEmail = new THREE.MeshLambertMaterial({
			map: THREE.ImageUtils.loadTexture( 'textures/moonemail.jpg' ),
			emissive: '#181818',
			shading: THREE.SmoothShading
		});
		materialEmail.originalEmissive = materialEmail.emissive.getHex();
		
		var beansMaterial = new THREE.MeshLambertMaterial({
			map: THREE.ImageUtils.loadTexture( 'textures/beans.jpg' ),
			emissive: '#111111',
			shading: THREE.SmoothShading
		});
		beansMaterial.originalEmissive = beansMaterial.emissive.getHex();

		//geometries
		var geo;
		var loader = new THREE.JSONLoader();
		
		// main text
		geo = new THREE.TextGeometry('JGRIFF.IN', {	font: 'fjalla one' });
		mainTextMesh = new THREE.Mesh(geo, mainTextMaterial);
		mainTextMesh.position.set(-62, -5, 0);
		mainTextMesh.rotation.y = -0.08;
		mainTextMesh.scale.set((15/60), 15/60, 15/250);
		scene.add(mainTextMesh);
		
		// 1. photography
		loader.load( "js/camera.js", function( geometries ) {
			cameraMesh = new THREE.Mesh(geometries, materialPhotography);
			cameraMesh.scale.set( sc*5, sc*5, sc*5 );
			cameraMesh.rotation.z = -12;
			cameraMesh.category = "photography";
			cameraMesh.subcategory = "photography";
			scene.add( cameraMesh );
			interactables.push(cameraMesh);
		} );
		
		// 2. social
		geo = new THREE.SphereGeometry(1, 46, 24);
		earthMesh = new THREE.Mesh(geo, earthMaterial);
		earthMesh.scale.set( sc/1.4, sc/1.4, sc/1.4 );
		earthMesh.category = "social";
		earthMesh.subcategory = "social";
		scene.add( earthMesh );
		interactables.push(earthMesh);
		
		// 2.1 email
		geo = new THREE.SphereGeometry(1, 24, 24);
		emailMesh = new THREE.Mesh(geo, materialEmail);
		emailMesh.scale.set( sc/2, sc/2, sc/2 );
		emailMesh.rotation.y = 4.2;
		emailMesh.category = "social";
		emailMesh.subcategory = "email";
		emailMesh.visible = false;
		scene.add(emailMesh);
		interactables.push(emailMesh);
		
		// 2.2 facebook
		geo = new THREE.SphereGeometry(1, 24, 24);
		facebookMesh = new THREE.Mesh(geo, materialFacebook);
		facebookMesh.scale.set( sc/2, sc/2, sc/2 );
		facebookMesh.rotation.y = 4.2;
		facebookMesh.category = "social";
		facebookMesh.subcategory = "facebook";
		facebookMesh.visible = false;
		scene.add(facebookMesh);
		interactables.push(facebookMesh);
		
		// 2.3 linkedin
		geo = new THREE.SphereGeometry(1, 24, 24);
		linkedinMesh = new THREE.Mesh(geo, materialLinkedin);
		linkedinMesh.scale.set( sc/2, sc/2, sc/2 );
		linkedinMesh.rotation.y = 4.2;
		linkedinMesh.category = "social";
		linkedinMesh.subcategory = "linkedin";
		linkedinMesh.visible = false;
		scene.add(linkedinMesh);
		interactables.push(linkedinMesh);
		
		// 3. beans
		geo = new THREE.CylinderGeometry(1, 1, 2.7, 60, 1, false);
		beansMesh = new THREE.Mesh(geo, beansMaterial);
		beansMesh.scale.set(sc/2.3, sc/2.3, sc/2.3);
		beansMesh.category = "misc";
		beansMesh.subcategory = "misc";
		beansMesh.rotation.y = 1;
		scene.add(beansMesh);
		interactables.push(beansMesh);
		
		// lens flare
		// a crude way of detecting devices that can't handle too many textures
		if ( height > 800 && width > 800 ) {
			var sunflare = THREE.ImageUtils.loadTexture( "textures/sun.png" );
			var lineflare = THREE.ImageUtils.loadTexture( "textures/line.png" );
			var hexagonflare = THREE.ImageUtils.loadTexture( "textures/hexagon.png" );
			var ghostflare = THREE.ImageUtils.loadTexture( "textures/ghost.png" );

			var flareColor = new THREE.Color( 0x161308 );
			lensFlare = new THREE.LensFlare( sunflare, 500, 0.0, THREE.SubtractiveBlending, flareColor );

			lensFlare.add( lineflare, 3000, 0.0, THREE.AdditiveBlending, flareColor );
			lensFlare.add( lineflare, 3000, 0.0, THREE.AdditiveBlending, flareColor );
			lensFlare.add( lineflare, 3000, 0.0, THREE.AdditiveBlending, flareColor );

			lensFlare.add( hexagonflare, 50, 1.3, THREE.AdditiveBlending, flareColor );
			lensFlare.add( ghostflare, 120, 1.6, THREE.AdditiveBlending, flareColor );
			lensFlare.add( hexagonflare, 100, 2.0, THREE.AdditiveBlending, flareColor );
			lensFlare.add( hexagonflare, 60, 2.3, THREE.AdditiveBlending, flareColor );

			lensFlare.position = sunPosition;

			scene.add( lensFlare );
		}
		
		// stats
		stats = new Stats();
		container.appendChild( stats.domElement );
		
		// listeners
		document.addEventListener( 'touchstart', onDocumentTouchStart, false );
		document.addEventListener( 'touchmove', onDocumentTouchMove, false );
		document.addEventListener( 'touchend', onDocumentTouchEnd, false );
		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		window.addEventListener( 'resize', onWindowResize, false );
		
		/* // variables			
		var gui = new dat.GUI();
		
		gui.addColor(variablesController, 'bgColor').onChange(updateVariables);
		gui.addColor(variablesController, 'hoverColor').onChange(updateVariables);
		gui.add(variablesController, 'lightIntensity', 0.8, 1.2).onChange(updateVariables);
		gui.add(variablesController, 'postprocessing').onChange(updateVariables);
		
		var cameraControls = gui.addFolder('Camera Controls');
		cameraControls.add(variablesController, 'resetCamera').onChange(updateVariables);
		cameraControls.add(variablesController, 'wideCamera').onChange(updateVariables);
		cameraControls.add(variablesController, 'topDownCamera').onChange(updateVariables);
		cameraControls.add(variablesController, 'followSocial').onChange(updateVariables);
		cameraControls.add(variablesController, 'followPhotography').onChange(updateVariables);
		cameraControls.add(variablesController, 'followBeans').onChange(updateVariables);
		*/
		
		// pp
		initPostprocessing();
	}
	
	
	// ray casting to see what's being clicked/touched
	function getIntersects( event, touch ) {
		var clientX, clientY;
		if(touch){
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		}
		else {
			clientX = event.clientX;
			clientY = event.clientY;
		}
		rayVector.set( ( clientX / window.innerWidth ) * 2 - 1, - ( clientY / window.innerHeight ) * 2 + 1, 0.5 );
		projector.unprojectVector( rayVector, camera );
		raycaster.set( camera.position, rayVector.sub( camera.position ).normalize() );
		return raycaster.intersectObjects( interactables );
	}
	
	// clicks
	function onDocumentMouseDown( event, touch ) {
		event.preventDefault();
		if (viewing3d) {
			grabbing = true;
			var intersects = getIntersects(event, touch);
			if ( intersects.length > 0 ) {
				var clickedObject = intersects[0].object;
				switch(clickedObject.subcategory) {
					case "photography":
						document.location.href = "/photography";
						break;
					case "facebook":
						document.location.href = "http://facebook.com/griffdogg";
						break;
					case "linkedin":
						document.location.href = "http://www.linkedin.com/profile/view?id=71149030";
						break;
					case "email":
						document.location.href = "mailto:wackro@gmail.com";
						break;
					case "misc":
						document.location.href = "/misc";
						break;
					case "social":
						if(touch)
							setNodesVisible(!socialNodesVisible);
						break;
				}
			}
		}
	}
	
	function onDocumentMouseUp( event ) {
		event.preventDefault();
		grabbing = false;
	}
	
	
	// hovers
	
	function onDocumentMouseMove( event, touch ) {
		event.preventDefault();
		touch ? setXY(event, true) : setXY(event, false);
		var intersects = getIntersects(event, touch);
		if ( intersects.length > 0 ) {
			hoveringObject = intersects[0].object;
			// on hover...
			if(!hovering) {
				// if this is the earth, make the moons visible
				if ( hoveringObject.subcategory == "social"
					|| (hoveringObject.caterory == "social" && hoveringObject.subcategory != "social" && socialNodesVisible) )
					setNodesVisible(true);
				// if the moons are visible, don't let that stop us from
				// highlighting other objects while the moons' timer ticks away
				if ( !(hoveringObject.category == "social" && hoveringObject.subcategory != "social" && !socialNodesVisible) ) {
					hovering = true;
					hoveringObject.material.emissive.multiply(new THREE.Color(hoverColor)).multiplyScalar(3);
				}
			}
			// restart timer
			if (hoveringObject.category == "social")
				d = Date.now();
			// change to pointy cursor
			container.style.cursor = 'pointer';
		}
		else {
			// on un-hover...
			if (hovering)
				hoveringObject.material.emissive.set(hoveringObject.material.originalEmissive);
			hovering = false;
			// change back to normal cursor
			container.style.cursor = 'auto';
		}
	}
	
	function setNodesVisible( b ) {
		facebookMesh.visible = b;
		emailMesh.visible = b;
		linkedinMesh.visible = b;
		socialNodesVisible = b;
	}
	
	function onDocumentTouchStart( event ) {
		if ( event.touches.length === 1 ) {
			event.preventDefault();
			onDocumentMouseDown(event, true);
		}
	}
	
	function onDocumentTouchMove( event ) {
		if ( event.touches.length === 1 ) {
			event.preventDefault();
			onDocumentMouseMove(event, true);
		}
	}
	
	function onDocumentTouchEnd( event ) {
		onDocumentMouseUp(event);
	}
	
	function setXY ( event, touch ) {
		if(touch) {
			mouseX = event.touches[0].pageX - windowHalfX;
			mouseY = event.touches[0].pageY - windowHalfY;
		}
		else {
			mouseX = event.pageX - windowHalfX;
			mouseY = event.pageY - windowHalfY;
		}
	}
	
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function initPostprocessing() {
		postprocessing.scene = new THREE.Scene();
		postprocessing.camera = new THREE.OrthographicCamera( window.innerWidth / - 2,
																window.innerWidth / 2, 
																height / 2,
																height / - 2,
																-10000,
																10000 );
		postprocessing.camera.position.z = 100;
		postprocessing.scene.add( postprocessing.camera );

		var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, alpha: true };
		postprocessing.rtTextureColors = new THREE.WebGLRenderTarget( window.innerWidth, height, pars );

		// Switching the depth formats to luminance from rgb doesn't seem to work. I didn't
		// investigate further for now.
		// pars.format = THREE.LuminanceFormat;

		// I would have this quarter size and use it as one of the ping-pong render
		// targets but the aliasing causes some temporal flickering
		postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, height, pars );

		// Aggressive downsize god-ray ping-pong render targets to minimize cost
		var w = window.innerWidth / 4.0;
		var h = height / 4.0;
		postprocessing.rtTextureGodRays1 = new THREE.WebGLRenderTarget( w, h, pars );
		postprocessing.rtTextureGodRays2 = new THREE.WebGLRenderTarget( w, h, pars );

		// god-ray shaders
		var godraysGenShader = THREE.ShaderGodRays[ "godrays_generate" ];
		postprocessing.godrayGenUniforms = THREE.UniformsUtils.clone( godraysGenShader.uniforms );
		postprocessing.materialGodraysGenerate = new THREE.ShaderMaterial( {
			uniforms: postprocessing.godrayGenUniforms,
			vertexShader: godraysGenShader.vertexShader,
			fragmentShader: godraysGenShader.fragmentShader
		} );

		var godraysCombineShader = THREE.ShaderGodRays[ "godrays_combine" ];
		postprocessing.godrayCombineUniforms = THREE.UniformsUtils.clone( godraysCombineShader.uniforms );
		postprocessing.materialGodraysCombine = new THREE.ShaderMaterial( {
			uniforms: postprocessing.godrayCombineUniforms,
			vertexShader: godraysCombineShader.vertexShader,
			fragmentShader: godraysCombineShader.fragmentShader
		} );

		postprocessing.godrayCombineUniforms.fGodRayIntensity.value = lightIntensity;

		postprocessing.quad = new THREE.Mesh( new THREE.PlaneGeometry( window.innerWidth, height ), postprocessing.materialGodraysGenerate );
		postprocessing.quad.position.z = -9900;
		postprocessing.scene.add( postprocessing.quad );
	}
	
	
	function followObject (object, offsetX, offsetY, offsetZ) {
		following = object;
		camera.position.set(object.position.x + offsetX, object.position.y + offsetY, object.position.z + offsetZ);
		camera.lookAt(object);
	}
	

	function animate() {
		requestAnimationFrame( animate, renderer.domElement );
		render();
		stats.update();
	}


	function render() {
		//updateVariables();
		hovering ? time += slowModifier : time += normalModifier;
		if (Date.now() >= d + 4000 && !hovering)
			setNodesVisible(false);
		
		// satellite, toOrbit, distance, speed, direction, axes, circularOffset, xFix, yFix, zFix
		orbit(earthMesh, scene, 71, 1, "cw", "xz", 0, 0, 0, 0);
		orbit(cameraMesh, scene, 101, 1, "cw", "xz", 2, 0, 0, 0);
		orbit(beansMesh, scene, 131, 1, "cw", "xz", 4.2, 0, 15, 0);
		orbit(emailMesh, earthMesh, 20, 3, "cw", "xy", 0, 0, 0, 0);
		orbit(facebookMesh, earthMesh, 20, 3, "cw", "xy", 0.666, 0, 0, 0);
		orbit(linkedinMesh, earthMesh, 20, 3, "cw", "xy", 1.333, 0, 0, 0);
		
		beansMesh.rotation.x += 0.01;
		beansMesh.rotation.z += 0.012;
		cameraMesh.rotation.x += 0.002;
		cameraMesh.rotation.y += 0.002;
		cameraMesh.rotation.z += 0.002;
		earthMesh.rotation.y += 0.015;
		
		if (grabbing) {
			camera.position.x += ( mouseX/8 - camera.position.x ) * 0.005;
			camera.position.y += ( - ( mouseY/12 ) - camera.position.y ) * 0.01;
		}
		else {
			camera.position.x -= (camera.position.x - camera.originalPosition.x) * 0.01;
			camera.position.y -= (camera.position.y - camera.originalPosition.y) * 0.02;
		}

		camera.lookAt( following.position );

		if ( postprocessing.enabled ) {
			// Find the screenspace position of the sun
			screenSpacePosition.copy( sunPosition );
			projector.projectVector( screenSpacePosition, camera );

			screenSpacePosition.x = ( screenSpacePosition.x + 1 ) / 2;
			screenSpacePosition.y = ( screenSpacePosition.y + 1 ) / 2;

			// Give it to the god-ray shader
			postprocessing.godrayGenUniforms[ "vSunPositionScreenSpace" ].value.x = screenSpacePosition.x;
			postprocessing.godrayGenUniforms[ "vSunPositionScreenSpace" ].value.y = screenSpacePosition.y;

			// -- Draw sky --
			// Clear colors and depths, will clear to sky color

			renderer.clearTarget( postprocessing.rtTextureColors, true, true, false );

			// -- Draw scene objects --
			// Colors
			scene.overrideMaterial = null;
			renderer.render( scene, camera, postprocessing.rtTextureColors );

			// Depth
			scene.overrideMaterial = materialDepth;
			renderer.render( scene, camera, postprocessing.rtTextureDepth, true );

			// -- Render god-rays --
			// Maximum length of god-rays (in texture space [0,1]X[0,1])

			var filterLen = 1.0;

			// Samples taken by filter
			var TAPS_PER_PASS = 6.0;

			// Pass order could equivalently be 3,2,1 (instead of 1,2,3), which
			// would start with a small filter support and grow to large. however
			// the large-to-small order produces less objectionable aliasing artifacts that
			// appear as a glimmer along the length of the beams

			// pass 1 - render into first ping-pong target
			var pass = 1.0;
			var stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

			postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
			postprocessing.godrayGenUniforms[ "tInput" ].value = postprocessing.rtTextureDepth;
			postprocessing.scene.overrideMaterial = postprocessing.materialGodraysGenerate;

			renderer.render( postprocessing.scene, postprocessing.camera, postprocessing.rtTextureGodRays2 );

			// pass 2 - render into second ping-pong target
			pass = 2.0;
			stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

			postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
			postprocessing.godrayGenUniforms[ "tInput" ].value = postprocessing.rtTextureGodRays2;

			renderer.render( postprocessing.scene, postprocessing.camera, postprocessing.rtTextureGodRays1  );

			// pass 3 - 1st RT
			pass = 3.0;
			stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

			postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
			postprocessing.godrayGenUniforms[ "tInput" ].value = postprocessing.rtTextureGodRays1;

			renderer.render( postprocessing.scene, postprocessing.camera , postprocessing.rtTextureGodRays2  );

			// final pass - composite god-rays onto colors
			postprocessing.godrayCombineUniforms["tColors"].value = postprocessing.rtTextureColors;
			postprocessing.godrayCombineUniforms["tGodRays"].value = postprocessing.rtTextureGodRays2;
			postprocessing.scene.overrideMaterial = postprocessing.materialGodraysCombine;

			renderer.render( postprocessing.scene, postprocessing.camera );
			postprocessing.scene.overrideMaterial = null;
		} else {
			renderer.clear();
			renderer.render( scene, camera );
		}
		
		// TODO: get rid of the hack
		function orbit( satellite, toOrbit, distance, speed, direction, axes, circularOffset, xFix, yFix, zFix ) {
			var cosRotation = Math.cos((time + circularOffset) * speed);
			var sinRotation = Math.sin((time + circularOffset) * speed);
				
			if ( direction == "acw") {
				cosRotation = -cosRotation;
				sinRotation = -sinRoataion;
			}
			
			if (axes == "xz") {
				satellite.position.x = toOrbit.position.x + xFix + cosRotation * distance;
				satellite.position.y = yFix + (25 * Math.sin( time * speed ));	// this is a HACK to get things to move up and down.
				satellite.position.z = toOrbit.position.z + zFix + sinRotation * distance;
			}
			else if (axes == "xy") {
				satellite.position.x = toOrbit.position.x + xFix + cosRotation * distance;
				satellite.position.y = toOrbit.position.y + yFix + sinRotation * distance;
				satellite.position.z = toOrbit.position.z + zFix;
			}
		}
	}
}

