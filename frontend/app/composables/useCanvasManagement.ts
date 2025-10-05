/**
 * Canvas management for infinite scrollable and zoomable workspace
 */
export const useCanvasManagement = () => {
  const canvasContainer = ref<HTMLElement>()
  const canvas = ref<HTMLElement>()

  const pan = ref({ x: 0, y: 0 })
  const isPanning = ref(false)
  const panStart = ref({ x: 0, y: 0 })
  const zoom = ref(1)

  const MIN_ZOOM = 0.1
  const MAX_ZOOM = 3
  const ZOOM_STEP = 0.1

  const canvasStyle = computed(() => ({
    transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
    transformOrigin: '0 0'
  }))

  const gridStyle = computed(() => ({
    backgroundPosition: `${pan.value.x}px ${pan.value.y}px, ${pan.value.x}px ${pan.value.y}px`,
    backgroundSize: `${40 * zoom.value}px ${40 * zoom.value}px, ${10 * zoom.value}px ${10 * zoom.value}px`
  }))

  const startPan = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    if (target === canvasContainer.value ||
        target.classList.contains('canvas-grid') ||
        target.classList.contains('canvas') ||
        target.classList.contains('center-marker') ||
        target.classList.contains('marker-cross')) {

      isPanning.value = true
      panStart.value = {
        x: event.clientX - pan.value.x,
        y: event.clientY - pan.value.y
      }
      document.body.style.cursor = 'grabbing'
      event.preventDefault()
    }
  }

  const handlePan = (event: MouseEvent) => {
    if (isPanning.value) {
      pan.value = {
        x: event.clientX - panStart.value.x,
        y: event.clientY - panStart.value.y
      }
    }
  }

  const endPan = () => {
    isPanning.value = false
    document.body.style.cursor = 'default'
  }

  const clampZoom = (value: number): number => {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value))
  }

  const getContainerCenter = (): { x: number; y: number } => {
    if (!canvasContainer.value) return { x: 0, y: 0 }
    const rect = canvasContainer.value.getBoundingClientRect()
    return {
      x: rect.width / 2,
      y: rect.height / 2
    }
  }

  /**
   * Zoom with anchor point support - keeps the point under cursor stable
   */
  const setZoom = (newZoom: number, anchorScreen?: { x: number; y: number }) => {
    const clampedZoom = clampZoom(newZoom)
    if (clampedZoom === zoom.value) return

    const anchor = anchorScreen || getContainerCenter()
    const currentZoom = zoom.value

    const canvasPointX = (anchor.x - pan.value.x) / currentZoom
    const canvasPointY = (anchor.y - pan.value.y) / currentZoom

    zoom.value = clampedZoom

    pan.value = {
      x: anchor.x - canvasPointX * zoom.value,
      y: anchor.y - canvasPointY * zoom.value
    }
  }

  const zoomIn = () => setZoom(zoom.value + ZOOM_STEP)
  const zoomOut = () => setZoom(zoom.value - ZOOM_STEP)

  const resetCanvas = () => {
    pan.value = { x: 0, y: 0 }
    zoom.value = 1
  }

  const onWheel = (event: WheelEvent) => {
    if (!canvasContainer.value) return

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()

      const rect = canvasContainer.value.getBoundingClientRect()
      const anchorScreen = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }

      const zoomDirection = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setZoom(zoom.value + zoomDirection, anchorScreen)
      return
    }

    event.preventDefault()
    const panSensitivity = 1.5

    pan.value = {
      x: pan.value.x - (event.deltaX * panSensitivity),
      y: pan.value.y - (event.deltaY * panSensitivity)
    }
  }

  return {
    canvasContainer,
    canvas,
    pan: readonly(pan),
    isPanning: readonly(isPanning),
    zoom: readonly(zoom),
    canvasStyle,
    gridStyle,
    startPan,
    handlePan,
    endPan,
    zoomIn,
    zoomOut,
    resetCanvas,
    onWheel,
    setZoom
  }
}