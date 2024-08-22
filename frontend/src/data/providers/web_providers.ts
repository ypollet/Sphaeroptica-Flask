import type { Matrix } from "mathjs";
import type { DataProvider } from "./providers";

import axios, { type AxiosResponse } from "axios";
import type { Coordinates } from "../models/coordinates";

export class WebProvider implements DataProvider {
    server: string;

    constructor(server: string) {
        this.server = server
    }

    async getImages(objectPath: string): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath +'/images';
        return axios.get(path)
    }

    async getImage(objectPath: string, imageName : string): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath + '/' + imageName
        return axios.get(path)
    }

    async getShorcuts(objectPath: string): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath + "/shortcuts";
        return axios.get(path)
    }

    async computeReprojection(objectPath: string, position: Array<number>, imageName: string): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath + '/reproject';
        return axios.post(path, {
            position: position,
            image: imageName
        })

    }

    async triangulate(objectPath: string, poses: Map<string, Coordinates>): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath + '/triangulate';
        return axios.post(path, {
            poses: Object.fromEntries(poses)
        })
    }

}