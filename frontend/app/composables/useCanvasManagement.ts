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

  // Stocker une référence à la fonction pour obtenir la première node
  let getFirstNodePosition: (() => { x: number; y: number } | null) | undefined

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
    // Réinitialiser le zoom à 1 pour un comportement cohérent
    zoom.value = 1

    // Si une fonction pour obtenir la position de la première node est fournie
    if (getFirstNodePosition) {
      const firstNodePos = getFirstNodePosition()

      // Si une première node existe, centrer la caméra dessus
      if (firstNodePos) {
        // Le canvas a un décalage initial : le point (100, 100) du canvas
        // correspond au centre du viewport quand pan = (0, 0)
        // Pour centrer sur la première node, on calcule le décalage nécessaire
        // par rapport à la position (100, 100)
        const canvasCenterX = 100
        const canvasCenterY = 100

        // Calculer le décalage de la node par rapport au centre du canvas
        const offsetX = firstNodePos.x - canvasCenterX
        const offsetY = firstNodePos.y - canvasCenterY

        // Appliquer ce décalage au pan (inversé car le pan déplace le canvas)
        // Avec zoom = 1, pas besoin de multiplier par le zoom
        pan.value = {
          x: -offsetX,
          y: -offsetY
        }
        return
      }
    }

    // Comportement par défaut : centrer sur (0, 0)
    pan.value = { x: 0, y: 0 }
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

  /**
   * Définir la fonction pour obtenir la position de la première node
   */
  const setFirstNodePositionGetter = (getter: () => { x: number; y: number } | null) => {
    getFirstNodePosition = getter
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
    setZoom,
    setFirstNodePositionGetter
  }
}