import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as math from 'mathjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function degreesToRad(deg: number) {
  return (deg * math.pi) / 180.0;
}

export function radToDegrees(rad: number) {
  return (rad * 180.0) / math.pi;
}

export enum Scale {
    m = 1,
    dm = 0.1,
    cm = 0.01,
    mm = 0.001,
    µm = 0.000001,
    nm = 0.000000001,
}


export const ZOOM_MIN = 0.1
export const ZOOM_MAX = 4
export const DOT_RADIUS = 4
export const SPACE_TARGET = 0.2

