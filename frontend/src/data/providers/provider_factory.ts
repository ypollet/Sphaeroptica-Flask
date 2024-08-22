import type { DataProvider } from "./providers";
import { WebProvider } from "./web_providers";
import { providerSettings } from "@/config/appSettings"

export class ProviderFactory{
    private static _instances = new Map<string, DataProvider>()

    static get(type : string) : DataProvider{
        if(this._instances.get(type) == null){
            if(type == "WEB"){
                return new WebProvider(providerSettings.url)
            }
        }
        return this._instances.get(type)!
    }
}