import type { Coordinates } from "@/data/models/coordinates"
export class LandmarkImage  {
    name: string
    image: string
    zoom: number
    offset: Coordinates
    versions : Map<string, number>
    reprojections : Map<string, Coordinates>

    constructor(name : string, image : string, zoom: number = 1, offset : Coordinates = {x:0, y:0}, versions : Map<string, number>= new Map(), reprojections : Map<string, Coordinates> = new Map()){
        this.name = name
        this.image = image
        this.zoom = zoom
        this.offset = offset
        this.versions = versions
        this.reprojections = reprojections
    }
}