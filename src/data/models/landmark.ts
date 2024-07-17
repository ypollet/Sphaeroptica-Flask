import Color from "color"
import axios from "axios"
import { type Matrix }  from "mathjs"
import type { Coordinates } from "@/data/models/coordinates"

export class Landmark {
    id: string
    version: number
    label: string
    poses: Map<string, Coordinates>
    color: Color
    position: Matrix | undefined
    edit: boolean

    constructor(id: string, label: string, version : number = 1,color: Color | null = null, poses: Map<string, Coordinates> = new Map(), position: Matrix | undefined = undefined) {
        this.id = id
        this.version = version
        this.label = label
        this.poses = poses
        this.edit = false

        if (color == null) {
            color = Color.rgb([Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)])
        }
        this.color = color
        this.position = position
    }

    equals(other : Landmark | string | null){
        if(other == null){
            return false
        }
        if(typeof other === "string"){
            return this.id == other
        }
        return this.id == other.id
    }

    toJSON() {
        return { id: this.id, label: this.label, color: this.color.hex(), position: this.position, poses: Object.fromEntries(this.poses) }
    }

    getId() : string {
        return this.id
    }
    getLabel() : string {
        return this.label
    }
    setLabel(label : string){
        this.label = label
    }

    getVersion() : number{
        return this.version
    }
    
    getColorHEX() : string{
        return this.color.hex()
    }
    setColorHEX(color: string) {
        this.color = Color(color)
    }
    setColorRGB(color: number[]) {
        if (color.length < 3) {
            return
        }
        this.color = Color.rgb(color[0], color[1], color[2])
    }

    addPose(image: string, pose: Coordinates) {
        this.poses.set(image, pose)
    }
    removePose(image: string) {
        this.poses.delete(image)
    }
    getPoses() : Map<String, Coordinates>{
        return this.poses
    }
    resetPoses(){
        this.position = undefined
        this.poses = new Map()
        this.version++
    }

    getPosition(){
        return this.position
    }

    setPosition(position : Matrix | undefined){
        this.position = position
        this.version++
    }
    getEdit() : boolean{
        return this.edit
    }
    setEdit(edit : boolean){
        this.edit = edit
    }
    
    triangulatePosition(objectPath : string) {
        console.log("triangulatePos for ", this.label, " : ", this.checkTriangulation())
        if(!this.checkTriangulation()){
            //not enough poses for triangulation, set position to undefined
            this.setPosition(undefined)
            return
        }
        console.log('Triangulate : ', this.label)
        console.log(this.poses)
        console.log(Object.fromEntries(this.poses))
        const path = 'http://localhost:5000/triangulate';
        axios.post(path, {
          study: objectPath,
          poses: Object.fromEntries(this.poses)
        })
          .then((res) => {
            console.log(res.data)
            let position = res.data.result.position 
            console.log("Position = " + position)
            this.position = position
            this.version++
          })
          .catch((error) => {
            console.error(error);
          });
      }

    checkTriangulation() {
        return this.poses.size >= 2
    }
}