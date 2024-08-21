type DrawLineProps = {
    prevPoint: Point | null
    currentPoint: Point
    color: string
}

type Draw = {
    ctx: CanvasRenderingContext2D
    currentPoint: Point
    prevPoint: Point | null
}