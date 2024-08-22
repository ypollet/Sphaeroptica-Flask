import type { Repository } from "./repository";
import { DataRepository } from "./data_repository";
import { WebProvider } from "../providers/web_providers";
import { ProviderFactory } from "../providers/provider_factory";
import { providerSettings } from "@/config/appSettings"

export class RepositoryFactory{
    private static _instances = new Map<string, Repository>()

    static get(type : string) : Repository{
        if(this._instances.get(type) == null){
            if(type == "DATA"){
                return new DataRepository(ProviderFactory.get(providerSettings.type))
            }
        }
        return this._instances.get(type)!
    }
}