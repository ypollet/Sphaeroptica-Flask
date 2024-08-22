import type { Repository } from "./repository";
import type { Coordinates } from "../models/coordinates";
import type { Shortcut } from "../models/shortcut";
import type { VirtualCameraImage } from "../models/virtual_camera_image";

import type { DataProvider } from "../providers/providers";
import type { LandmarkImage } from "../models/landmark_image";

export class DataRepository implements Repository {
    provider: DataProvider;

    constructor(provider: DataProvider) {
        this.provider = provider
    }

    async getImages(objectPath: string): Promise<Array<VirtualCameraImage>> {
        return this.provider.getImages(objectPath).then((res) => {
            let images = res.data.result.images as VirtualCameraImage[]
            return images
        })
    }

    async getImage(objectPath: string, imageName : string): Promise<LandmarkImage> {
        return this.provider.getImage(objectPath, imageName).then((response) => {
            return{
                name: imageName,
                image: response.data,
                zoom: -1,
                offset: {x:0, y:0},
                versions : new Map(),
                reprojections : new Map()
              }
        })

    }

    async getShorcuts(objectPath: string): Promise<Array<Shortcut>> {
        return this.provider.getShorcuts(objectPath).then((res) => {
            let shortcuts = res.data.result.commands as Shortcut[];
            return shortcuts
        })
    }

    async computeReprojection(objectPath: string, position: Array<number>, imageName: string): Promise<Coordinates> {
        return this.provider.computeReprojection(objectPath, position, imageName).then((res) => {
            let pose: Coordinates = res.data.result.pose
            return pose
        })
    }

    async triangulate(objectPath: string, poses: Map<string, Coordinates>): Promise<Array<number> | undefined> {
        return this.provider.triangulate(objectPath, poses).then((res) => {
            let position = res.data.result.position
            return position
        })

    }

}