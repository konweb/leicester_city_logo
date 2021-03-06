var is_develop = true;
var is_helper  = true;

window.addEventListener("DOMContentLoaded", function(){
  var requestAnimationFrame = ( function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
              window.setTimeout( callback, 1000.0 / 60.0 );
            };
  } )();

  // マウスコントローラー 設定値
  var trackballControlParams = {
    'rotateSpeed'          : 0.5,   // 回転の速さ
    'zoomSpeed'            : 0.5,   // ズームの速さ
    'minDistance'          : 10,    // 最小値
    'maxDistance'          : 300,   // 最大値
    'panSpeed'             : 1.0,   // パン速度の設定
    'staticMoving'         : false, // true:スタティックムーブ false:ダイナミックムーブ
    'dynamicDampingFactor' : 0.2,   // ダイナミックムーブ減衰値
    'noRotate'             : false,
    'noZoom'               : false,
    'noPan'                : false
  };

  // ライト 設定値
  var lightParams = {
    'intensity'  : 2,
    'angle'      : 0.7,
    'castShadow' : true,
    'x'          : 70,
    'y'          : 90,
    'z'          : 90
  };

  // Font 設定値
  var fontParams = {
    'color'         : '#095ebe',
    'size'          : 5,
    'height'        : 0,
    'curveSegments' : 1,
    'bevelEnabled'  : false,
    'x'             : 0,
    'y'             : 30,
    'z'             : 0
  };

  var camera,
      controls,
      scene,
      renderer,
      flagMesh,
      cubeParent,
      lighthelper,
      light,
      textGeo,
      textMesh,
      textMaterial;
  var SEGX      = 64;
  var SEGY      = 64;
  var PAPER_NUM = 2000;
  var canvas    = document.getElementById("canvas");
  var stats     = new Stats();
  
  init();
  render();
  animate();

  if ( is_develop ) {
    stats_init();
    dat_gui_init();
  }


  /**
   * 初期設定
  */
  function init(){
    /*
     * カメラを用意
     * THREE.PerspectiveCamera(画角, 縦横比, クリッピング手前, クリッピング奥);
     * クリッピング手前からクリッピング奥までが描画される
     */
    var width  = canvas.clientWidth,
        height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(45, width/height, 1, 1000);
    camera.position.set(-20, 20, 100);

    /*
     * マウスコントロール
     */
    controls = new THREE.TrackballControls( camera,canvas );
    controls.addEventListener( 'change', render );
    settingTrackballControls();
  
    /*
     * シーンの準備
     * ここに様々なオブジェクトを詰め込んでいく
     */
    scene = new THREE.Scene();
    // scene.fog = new THREE.FogExp2(0xffffff, 0.01);

    /* 
     * 旗の作成
     */
    var flag          = new THREE.PlaneGeometry(25, 25, SEGX, SEGY);
    var flagImgloader = new THREE.TextureLoader();
    var flagImg       = flagImgloader.load('images/leicestercity_logo.png');
    var flagMaterial  = new THREE.MeshLambertMaterial( {color: 0xffffff, side: THREE.DoubleSide, map: flagImg, alphaTest: 0.5} );
    flagMesh          = new THREE.Mesh(flag, flagMaterial);
    flagMesh.castShadow = true;
    flagMesh.position.y = 10;
    scene.add(flagMesh);

    /*
     * 地面の作成
     */
    var plane         = new THREE.PlaneGeometry(100, 100, 64, 64);
    var lawnImgloader = new THREE.TextureLoader();
    var lawnImg       = lawnImgloader.load('images/lawn.png');
    var planeMaterial = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, map: lawnImg});
    var planeMesh     = new THREE.Mesh(plane, planeMaterial);

    // x軸を90度回転
    planeMesh.rotation.x = Math.PI / -2;
    planeMesh.position.y = -5;
    //影の有効化          
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);

    /*
     * 紙吹雪の作成
     */
    cubeParent = new THREE.Object3D();
    var cubeItem = new THREE.CubeGeometry(1, 2, 0.02);
    for (var i = 0; i < PAPER_NUM; i++) {
      var object = new THREE.Mesh( cubeItem, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
      object.position.x = Math.random() * (-200 - 0);
      object.position.y = Math.random() * (200 - 30) + 30;
      object.position.z = Math.random() * (100 - -100) - 100;
      cubeParent.add(object);
    }
    scene.add( cubeParent );

    /*
     * テキストの作成
     */
    createFont();

    /*
     * 光源の作成
     */
    light = new THREE.SpotLight( 0xffffff );
    settingLight();
    scene.add(light);

    /*
     * lightヘルパー
     */
    if ( is_helper ) {
      lighthelper = new THREE.SpotLightHelper(light);
      scene.add(lighthelper);
    }

    /* 
     * レンダラーを用意
     * 実際に描画を行うための処理
     */
    renderer = new THREE.WebGLRenderer();
  
    // 大きさの定義
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMapEnabled = true;
  
    // DOMにcanvasを追加
    canvas.appendChild( renderer.domElement );
  }

  /**
   * マウスコントローラー設定
   * @return {[type]} [description]
   */
  function settingTrackballControls() {
    controls.rotateSpeed          = trackballControlParams.rotateSpeed;
    controls.zoomSpeed            = trackballControlParams.zoomSpeed;
    controls.minDistance          = trackballControlParams.minDistance;
    controls.maxDistance          = trackballControlParams.maxDistance;
    controls.panSpeed             = trackballControlParams.panSpeed;
    controls.staticMoving         = trackballControlParams.staticMoving;
    controls.dynamicDampingFactor = trackballControlParams.dynamicDampingFactor;
    controls.noRotate             = trackballControlParams.noRotate;
    controls.noZoom               = trackballControlParams.noZoom;
    controls.noPan                = trackballControlParams.noPan;
  }

  /**
   * 光源の設定
   * @return {[type]} [description]
   */
  function settingLight() {
    light.intensity  = lightParams.intensity;
    light.angle      = lightParams.angle;
    light.castShadow = lightParams.castShadow;
    light.position.set( lightParams.x, lightParams.y, lightParams.z );

    if (lighthelper) {
      lighthelper.light = light;
    }
  }

  /*
   * テキストの作成
   */
  function createFont() {
    // オブジェクトが存在する場合は、一旦削除する
    if ( textMesh ) {
      scene.remove( textMesh );
      textGeo.dispose();
      textMaterial.dispose();
    }

    var loader = new THREE.FontLoader();
    loader.load( 'js/helvetiker_bold.typeface.js', function ( font ) {
      textGeo = new THREE.TextGeometry(
        'Leicester City Premier League Winners',
        {
          font: font,
          size: fontParams.size,
          height: fontParams.height,
          curveSegments: fontParams.curveSegments,
          bevelEnabled: fontParams.bevelEnabled
        }
      );
      textMaterial = new THREE.MeshPhongMaterial( { color: fontParams.color } );
      textMesh     = new THREE.Mesh( textGeo, textMaterial );

      // 中央配置
      THREE.GeometryUtils.center( textGeo );

      textMesh.position.set( fontParams.x, fontParams.y, fontParams.z );
      scene.add( textMesh );
    } );
  }

  /** 
   * 描画処理
   * レンダラー.render(シーン, カメラ)
   */
  function render(){
    renderer.render(scene, camera);
  }

  /**
   * アニメーション
   */
  function animate(){
    requestAnimationFrame(animate);

    // TrackballControlsを更新
    controls.update();

    // 旗オブジェクト
    update_flag();

    // カメラ
    // update_camera();

    // 紙吹雪オブジェクト
    update_cube();

    // ライトオブジェクト
    update_light();

    // stats.js
    update_stats();

    // 描画の更新
    render();
  }

  /**
   * カメラ 更新処理
   */
  function update_camera(){
    var timer = Date.now();
    camera.position.x = 15 * Math.sin( timer / 50 * Math.PI / 360 );
    camera.position.z = 15 * Math.cos( timer / 50 * Math.PI / 360 );
    camera.lookAt( scene.position );
  }

  /**
   * 旗オブジェクト 更新処理
   */
  var startData = new Date();
  function update_flag(){
    flagMesh.geometry.verticesNeedUpdate = true;
    var time = (new Date() - startData)/1000;
    for (var i = 0;i < SEGX+1;i++) {
      for (var j = 0;j < SEGY+1;j++) {
        //(i,j)のvertexを得る
        var index = j * (SEGX + 1) + i % (SEGX + 1);
        var vertex = flagMesh.geometry.vertices[index];
        //時間経過と頂点の位置によって波を作る
        var amp = 0.5 * noise.perlin3(i/500+time/5,j/70,time);
        // var amp = 5;//振幅
        vertex.z = amp * Math.sin( -i/2 + time*15 );
      }
    }
  }

  /**
   * 紙吹雪オブジェクト 更新処理
   */
  function update_cube(){
    for (var i = 0; i < PAPER_NUM; i++) {
      cubeParent.children[i].rotation.x += Math.random(1 * 0) * 0.3;
      cubeParent.children[i].rotation.y += Math.random(1 * 0) * 0.3;
      cubeParent.children[i].position.x += Math.random(1 * 0) * 0.3;
      cubeParent.children[i].position.y -= Math.random(1 * 0) * 0.3;
      if(cubeParent.children[i].position.y < -30){
        cubeParent.children[i].position.x = Math.random() * (-200 - 0);
        cubeParent.children[i].position.y = Math.random() * (200 - 30) + 30;
      }
    }
  }

  /**
   * ライトの更新処理
   */
  function update_light() {
    // light.position.set( lightParams.x++, lightParams.y++, lightParams.z );
  }

  /**
   * リサイズイベントの登録
   * レンダラーとカメラを更新
   * @return {[type]}   [description]
   */
  window.addEventListener('resize', function() {
    var window_width  = window.innerWidth;
    var window_height = window.innerHeight;

    renderer.setSize(window_width, window_height);
    camera.aspect = window_width / window_height;
    camera.updateProjectionMatrix();
  });

  /**
   * stats.js 初期設定
   */
  function stats_init(){
    stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );
  }

  /**
   * stats.js 更新
   */
  function update_stats(){
    stats.begin();
    // monitored code goes here
    stats.end();
  }

  function dat_gui_init() {
    var gui                = new dat.GUI();
    var lightFolder        = gui.addFolder('Lights');
    var mouseControlFolder = gui.addFolder('mouseControls');
    var fontFolder         = gui.addFolder('Fonts');

    gui.close();

    // ライト
    lightFolder.add(lightParams, 'intensity', 0, 10).step(0.1).onChange( settingLight );
    lightFolder.add(lightParams, 'angle', 0, 1.56).step(0.1).onChange( settingLight );
    lightFolder.add(lightParams, 'castShadow').onChange( settingLight );
    lightFolder.add(lightParams, 'x', 0, 1000).step(1).onChange( settingLight );
    lightFolder.add(lightParams, 'y', 0, 1000).step(1).onChange( settingLight );
    lightFolder.add(lightParams, 'z', 0, 1000).step(1).onChange( settingLight );

    // マウスコントローラー
    mouseControlFolder.add(trackballControlParams, 'rotateSpeed', 0.1, 10).step(0.1).onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'zoomSpeed', 0.1, 10).step(0.1).onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'minDistance', 0, 100).step(1).onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'maxDistance', 100, 1000).step(1).onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'panSpeed', 0, 10).step(1).onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'staticMoving').onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'dynamicDampingFactor', 0, 1).step(0.1).onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'noRotate').onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'noZoom').onChange( settingTrackballControls );
    mouseControlFolder.add(trackballControlParams, 'noPan').onChange( settingTrackballControls );

    // Font
    fontFolder.addColor(fontParams, 'color').onChange( function(val) {
      textMesh.material.color = new THREE.Color( val );
    } );
    fontFolder.add(fontParams, 'size', 1, 20).step(1).onChange( createFont );
    fontFolder.add(fontParams, 'height', 0, 20).step(1).onChange( createFont );
    fontFolder.add(fontParams, 'curveSegments', 1, 20).step(1).onChange( createFont );
    fontFolder.add(fontParams, 'x', -100, 100).step(1).onChange( function(val) {
      textMesh.position.x = val;
    } );
    fontFolder.add(fontParams, 'y', -100, 100).step(1).onChange( function(val) {
      textMesh.position.y = val;
    } );
    fontFolder.add(fontParams, 'z', -100, 100).step(1).onChange( function(val) {
      textMesh.position.z = val;
    } );
  }
});