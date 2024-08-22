import type { VirtualCameraImage } from "@/data/models/virtual_camera_image";
import type { Coordinates } from "@/data/models/coordinates";
import type { Shortcut } from "@/data/models/shortcut";
import type { LandmarkImage } from "../models/landmark_image";

export interface Repository {
    getImages : (objectPath:string) => Promise<Array<VirtualCameraImage>>;
    getImage : (objectPath:string, imageName : string) => Promise<LandmarkImage>;
    getShorcuts : (objectPath:string) => Promise<Array<Shortcut>>;
    computeReprojection : (objectPath:string, position: Array<number>, imageName: string) => Promise<Coordinates>;
    triangulate: (objectPath : string, poses: Map<string, Coordinates>) => Promise<Array<number> | undefined>
}