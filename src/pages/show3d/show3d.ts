import { Component, NgZone, ViewChild, ElementRef } from '@angular/core';
import { Platform, Events, IonicPage, NavController, NavParams } from 'ionic-angular';
import { ATCMDHDLQCCSNK } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-sink';
import { BabylonjsProvider } from './../../providers/babylonjs/babylonjs';
import { Scene, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, ArcRotateCamera, Texture, PhysicsImpostor, VertexData, FreeCamera } from 'babylonjs';

/**
 * Generated class for the Show3dPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-show3d',
  templateUrl: 'show3d.html',
})
export class Show3dPage 
{
  @ViewChild('surface') surface: ElementRef;

  protected atCmdHandler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = null;
  private bindedFunctions : {};

  private _scene : Scene;
  private _camera : any;
  private _lightOne : HemisphericLight;

  private _sphere : any;
  private _sphere2 : any;
  private _square : any;
  private _ground : any;

  constructor
  (
    public platform: Platform,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private zone: NgZone,
    public events: Events,
    private engine : BabylonjsProvider
  ) 
  {
    this.atCmdHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.navParams.get('atCmdHandler');

    // Register for android's system back button
    let backAction =  platform.registerBackButtonAction(() => {
      console.log("[SHOW3D] user page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
      backAction();
    },2)
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Show3dPage');
    this.engine.createEngine(this.surface.nativeElement);
    this.surface.nativeElement.width = window.innerWidth;
    this.surface.nativeElement.height = window.innerHeight;
    this.surface.nativeElement.style.width = '100%';
    this.surface.nativeElement.style.height = '100%';
    this.createScene();
    this.animate();
  }

  ionViewWillEnter()
  {
    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;
  }

  ionViewDidLeave()
  {
    for( var key in this.bindedFunctions )
    {
      var fn = this.bindedFunctions[key];
      this.events.unsubscribe(key, fn);
    }

    this.bindedFunctions = null;
  }


  private handleBleDevChanged(params)
  {
    if( params.action == 'disconnect' )
    {
      console.log("[SHOW3D] disconnect page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
    }
  }

  createScene(): void {
    // create a basic BJS Scene object
    this._scene = new Scene(this.engine.getEngine());

    {
      // This creates and positions a free camera (non-mesh)
      this._camera = new FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), this._scene);

      // This targets the camera to scene origin
      this._camera.setTarget(BABYLON.Vector3.Zero());

      // This attaches the camera to the canvas
      this._camera.attachControl(this.surface.nativeElement, true);

      // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
      this._lightOne = new HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this._scene);

      // Default intensity is 1. Let's dim the light a small amount
      this._lightOne.intensity = 0.7;

      // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
      // this._sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, this._scene);
      this._square = BABYLON.Mesh.CreateBox("square", 1, this._scene);

      // Move the sphere upward 1/2 its height
      this._square.position.y = 1;

      // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
      this._ground = BABYLON.Mesh.CreateGround("ground1", 3, 3, 2, this._scene);
    }

    // {
    //   this._camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), this._scene);
    //   this._camera.attachControl(this.surface.nativeElement, false);

    //   var normalHelper = new NormalHelper();

    //   this._lightOne = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 0.5, 0), this._scene);
    //   this._lightOne.intensity = 0.8;

    //   this._sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", {segments:3}, this._scene);
    //   this._sphere.position.y = 1;
    //   this._sphere.material = new BABYLON.StandardMaterial("mat1", this._scene);
    //   this._sphere.material.wireframe = true;
    //   normalHelper.showNormals(this._sphere, 0.25, new BABYLON.Color3(1, 0, 0), this._scene);

    //   this._sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere2", {segments:6}, this._scene);
    //   this._sphere2.convertToFlatShadedMesh();
    //   this._sphere2.position.y = -1;
    //   this._sphere2.material = new BABYLON.StandardMaterial("mat2", this._scene);
    //   this._sphere2.material.wireframe = true;
    //   normalHelper.showNormals(this._sphere2, 0.25, new BABYLON.Color3(1, 0, 0), this._scene);
    // }
  }

  animate(): void 
  {
      // run the render loop
      this.engine.start(this._scene);
  }
}

class NormalHelper 
{
  public showNormals(mesh: BABYLON.Mesh, size, color, sc: BABYLON.Scene): BABYLON.LinesMesh 
  {
    var normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    var positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);      
    color = color || BABYLON.Color3.White();
    size = size || 1;

    var lines = [];
    for (var i = 0; i < normals.length; i += 3) {
        var v1 = BABYLON.Vector3.FromArray(positions, i);
        var v2 = v1.add(BABYLON.Vector3.FromArray(normals, i).scaleInPlace(size));
        lines.push([v1.add(mesh.position), v2.add(mesh.position)]);
    }
    var normalLines = BABYLON.MeshBuilder.CreateLineSystem("normalLines", {lines: lines}, sc);
    normalLines.color = color;
    return normalLines;
  }
}

