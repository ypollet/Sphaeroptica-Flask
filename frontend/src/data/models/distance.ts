import type { Landmark } from "@/data/models/landmark"
import * as math from "mathjs"

export class Distance {
    label : string
    landmarkLeft : Landmark
    landmarkRight : Landmark
    edit_label: boolean
    edit_distance: boolean
    
    constructor(label: string, left: Landmark, right : Landmark){
        console.log("Creation Distance : " + left.id + " " + right.id)
        this.label = label
        this.landmarkLeft = left
        this.landmarkRight = right
        this.edit_label = false
        this.edit_distance = false
    }

    get distance() : number | undefined{
        if(this.landmarkLeft.position == undefined || this.landmarkRight.position == undefined){
            return undefined
        }
        return math.number(math.distance(this.landmarkLeft.position, this.landmarkRight.position))
    }

    in(landmark : Landmark | string) : boolean{
        console.log(this.landmarkLeft.equals(landmark) || this.landmarkRight.equals(landmark))
        return this.landmarkLeft.equals(landmark) || this.landmarkRight.equals(landmark)
    }

    equals(other : Distance){
        console.log("Equals DIstance")
        console.log(this.landmarkLeft.equals(other.landmarkLeft) && this.landmarkRight.equals(other.landmarkRight))
        console.log(this.landmarkLeft.equals(other.landmarkRight) && this.landmarkRight.equals(other.landmarkLeft))
        return (this.landmarkLeft.equals(other.landmarkLeft) && this.landmarkRight.equals(other.landmarkRight))
            || (this.landmarkLeft.equals(other.landmarkRight) && this.landmarkRight.equals(other.landmarkLeft))
    }
}