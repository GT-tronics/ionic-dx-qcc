import { Component, NgZone, ViewChild, ElementRef } from '@angular/core';
import { Platform, Events, IonicPage, NavController, NavParams } from 'ionic-angular';
import { ATCMDHDLQCCSNK } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-sink';
import { ATCMDHDLIMU } from '../../providers/atcmd-dispatcher/atcmd-handler-imu';
import { BabylonjsProvider } from './../../providers/babylonjs/babylonjs';
import { Scene, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, ArcRotateCamera, Texture, PhysicsImpostor, VertexData, FreeCamera, AssetsManager } from 'babylonjs';
import 'babylonjs-loaders';
import 'pepjs';
import { directive } from '@angular/core/src/render3/instructions';

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

  protected cmdChHandler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = null;
  protected dataChHandler : ATCMDHDLIMU.AtCmdHandler_IMU = null;
  private bindedFunctions : {};

  private _scene : Scene;
  private _camera : any;
  private _lightOne : HemisphericLight;

  private _sphere : any;
  private _sphere2 : any;
  private _square : any;
  private _ground : any;
  private _centerPiece : BABYLON.AbstractMesh;

  private gamEnableButtonColor = 'dark';
  private currTimeStamp = 0;
  private prevTimeStamp = 0;
  private timeDiff = 0; 

  private x : number;
  private y : number;
  private z : number;
  private w : number;

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
    this.cmdChHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.navParams.get('cmdChHandler');
    this.dataChHandler = <ATCMDHDLIMU.AtCmdHandler_IMU>this.navParams.get('dataChHandler');

    // Register for android's system back button
    let backAction =  platform.registerBackButtonAction(() => {
      console.log("[SHOW3D] user page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
      backAction();
    },2)
  }

  ionViewDidLoad() {
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

    fn = this.handleGamNotification.bind(this);
    this.events.subscribe('IMU_GAM_NOTI', fn);
    this.bindedFunctions['IMU_GAM_NOTI'] = fn;

    this.currTimeStamp = this.prevTimeStamp = 0;

    this.x = this.y = this.z = 0;
    this.w = 1.0;

    // if( this.dataChHandler )
    // {
    //   this.dataChHandler.startProcessImu((params) => {
    //     this.zone.run(() => {
    //       // this.timeDiff = this.currTimeStamp - this.prevTimeStamp;
    //       this.timeDiff = params.timeDiff;
    //     });   
    //     this.w = params.q0;
    //     this.x = params.q1;
    //     this.y = params.q2;
    //     this.z = params.q3;
    //   });
    // }

    this.dataChHandler.atCmdGAM.reset();
  }

  ionViewDidLeave()
  {
    for( var key in this.bindedFunctions )
    {
      var fn = this.bindedFunctions[key];
      this.events.unsubscribe(key, fn);
    }

    this.bindedFunctions = null;

    this.dataChHandler.stopProcessImu();
  }


  private handleBleDevChanged(params)
  {
    if( params.action == 'disconnect' )
    {
      console.log("[SHOW3D] disconnect page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
    }
  }

  private handleGamNotification(params)
  {
    if( this.currTimeStamp -  this.prevTimeStamp > 1000 )
    {
      this.prevTimeStamp = this.currTimeStamp;

      // Android SPP needs this to prevent latency
      this.dataChHandler.sendCb(this.dataChHandler.uuid, "AT\r\n");
    }
    this.currTimeStamp = params.timeStamp;

    // console.log("+GAM: " + this.currTimeStamp + " " + this.prevTimeStamp);

    this.zone.run(() => {
      // this.timeDiff = this.currTimeStamp - this.prevTimeStamp;
      this.timeDiff = params.timeDiff;
    });   
    
    this.w = params.q0;
    this.x = params.q1;
    this.y = params.q2;
    this.z = params.q3;
  }

  createScene(): void {
    // create a basic BJS Scene object
    this._scene = new Scene(this.engine.getEngine());

    {
      //Adding a light
      var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(2, 2, 10), this._scene);

      //Adding an Arc Rotate Camera
      var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 0, BABYLON.Vector3.Zero(), this._scene);
      camera.attachControl(this.surface.nativeElement, false);

      this._square = BABYLON.Mesh.CreateBox("square", 1, this._scene);

      var assetsManager = new BABYLON.AssetsManager(this._scene);
      var meshTask = assetsManager.addMeshTask("centerpiece", "", "assets/scenes/", "skull.babylon");
      meshTask.onSuccess = function (task) {
        camera.setTarget(task.loadedMeshes[0]);
        task.loadedMeshes[0].scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
        task.loadedMeshes[0].rotation.y += 0.3;
        task.loadedMeshes[0].rotation.x -= 0.3;
        this._centerPiece = task.loadedMeshes[0];      
      }.bind(this);
      meshTask.onError = function (task, message, exception) {
        console.log(message, exception);
      };

      // The first parameter can be used to specify which mesh to import. Here we import all meshes
      //   BABYLON.SceneLoader.ImportMesh("", "assets/scenes/", "skull.babylon", this._scene, function (newMeshes) {
      //       // Set the target of the camera to the first imported mesh
      //       camera.setTarget(newMeshes[0]);
      //       newMeshes[0].scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
      //       newMeshes[0].rotation.y += 0.3;
      //       newMeshes[0].rotation.x -= 0.3;
      //       this._centerPiece = newMeshes[0]; 
      // });
  
      assetsManager.load();

      // Move the light with the camera
      this._scene.registerBeforeRender(function () {
          light.position = camera.position;
          if( this._centerPiece )
          {
            // this._centerPiece.rotation.y += 0.01;
            this._centerPiece.rotationQuaternion = new BABYLON.Quaternion(this.x, this.y, this.z, this.w);
          }
        }.bind(this));
    }

    // {
    //   // This creates and positions a free camera (non-mesh)
    //   this._camera = new FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), this._scene);

    //   // This targets the camera to scene origin
    //   this._camera.setTarget(BABYLON.Vector3.Zero());

    //   // This attaches the camera to the canvas
    //   this._camera.attachControl(this.surface.nativeElement, true);

    //   // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    //   this._lightOne = new HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this._scene);

    //   // Default intensity is 1. Let's dim the light a small amount
    //   this._lightOne.intensity = 0.7;

    //   // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    //   // this._sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, this._scene);
    //   this._square = BABYLON.Mesh.CreateBox("square", 1, this._scene);

    //   // Move the sphere upward 1/2 its height
    //   this._square.position.y = 1;

    //   // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
    //   this._ground = BABYLON.Mesh.CreateGround("ground1", 3, 3, 2, this._scene);
    // }

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

  gamEnableButtonPressed() : void
  {
    console.log("Y: " + this._centerPiece.rotation.y);

    this._centerPiece.rotation.y += 0.1;

    if( !this.cmdChHandler )
    {
      return;
    }

    if( this.gamEnableButtonColor == 'dark' )
    {
      this.cmdChHandler.sendCmd("AT+SEN=3,3", 0).then( ret => {
        console.log("[] AT+SEN sent OK");
        this.gamEnableButtonColor = 'danger';
      }).catch( obj => {
        console.log("[] AT+SEN sent fail");
      });
    }
    else
    {
      this.cmdChHandler.sendCmd("AT+SEN=0,0", 0).then( ret => {
        console.log("[] AT+SEN sent OK");
        this.gamEnableButtonColor = 'dark';
      }).catch( obj => {
        console.log("[] AT+SEN sent fail");
      });
    }
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

