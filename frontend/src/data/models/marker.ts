
import Color from "color"
import type { Coordinates } from "@/data/models/coordinates"

export type Marker = {
    id : string,
    pos : Coordinates,
    color : Color
}