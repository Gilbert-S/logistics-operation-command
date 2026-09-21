import { default as L } from "leaflet"





const drawColorPalette = [
  "#3388ff",
  "#8e44ad",
  "#ff69b4",
  "#e53935",
  "#ff8f00",
  "#ffff54",
  "#43a047",
  "#00ff00",
  "#a0522d",
]

const paletteIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></svg>`





export const ColorAndLineWidthControl = L.Control.extend({
  options: { position: "bottomright" },

  onAdd: function(map: L.Map)
  {
    let currentColor = drawColorPalette[0]
    let currentWidth = 3

    const applyDrawStyle = () =>
    {
      map.pm.setGlobalOptions({
        pathOptions: {
          color: currentColor,
          fillColor: currentColor,
          weight: currentWidth,
        },
        templineStyle: {
          color: currentColor,
          fillColor: currentColor,
          weight: currentWidth,
        },
        hintlineStyle: {
          color: currentColor,
          fillColor: currentColor,
          weight: currentWidth,
          dashArray: [5, 5],
        },
      })
    }

    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control-draw-style")
    container.style.position = "relative"
    L.DomEvent.disableClickPropagation(container)

    const toggleButton = L.DomUtil.create("a", "leaflet-control-draw-style-toggle", container)
    toggleButton.href = "#"
    toggleButton.title = "Drawing color & line width"
    toggleButton.innerHTML = paletteIconSvg
    Object.assign(toggleButton.style, {
      alignItems: "center",
      borderRadius: "3px",
      display: "flex",
      height: "30px",
      justifyContent: "center",
      width: "30px",
    })

    const panel = L.DomUtil.create("div", "leaflet-control-draw-style-panel", container)
    Object.assign(panel.style, {
      background: "var(--sidebar, #fff)",
      border: "1px solid var(--ring, #ccc)",
      borderRadius: "4px",
      bottom: "0",
      display: "none",
      flexDirection: "column",
      gap: "8px",
      marginRight: "1px",
      padding: "8px",
      position: "absolute",
      right: "100%",
      width: "max-content",
    })

    const grid = L.DomUtil.create("div", "leaflet-control-draw-style-grid", panel)
    Object.assign(grid.style, {
      display: "grid",
      gap: "4px",
      gridTemplateColumns: "repeat(3, 20px)",
    })

    let selectedSwatch: HTMLButtonElement | null = null

    drawColorPalette.forEach((color) =>
    {
      const swatch = L.DomUtil.create<"button">("button", "leaflet-control-draw-style-swatch", grid)
      swatch.type = "button"
      swatch.title = color
      Object.assign(swatch.style, {
        backgroundColor: color,
        border: "2px solid transparent",
        borderRadius: "3px",
        cursor: "pointer",
        height: "20px",
        padding: "0",
        width: "20px",
      })

      if (color === currentColor)
      {
        swatch.style.borderColor = "var(--foreground, #000)"
        selectedSwatch = swatch
      }

      L.DomEvent.on(swatch, "click", (event) =>
      {
        L.DomEvent.stop(event)
        currentColor = color
        if (selectedSwatch)
          selectedSwatch.style.borderColor = "transparent"
        swatch.style.borderColor = "var(--foreground, #000)"
        selectedSwatch = swatch
        applyDrawStyle()
      })
    })

    const sliderRow = L.DomUtil.create("label", "leaflet-control-draw-style-slider-row", panel)
    Object.assign(sliderRow.style, {
      color: "var(--foreground, #333)",
      display: "flex",
      flexDirection: "column",
      fontSize: "11px",
      gap: "4px",
    })

    const sliderLabel = L.DomUtil.create("span", "", sliderRow)
    sliderLabel.textContent = `Line width: ${currentWidth}`

    const slider =
      L.DomUtil.create<"input">("input", "leaflet-control-draw-style-slider", sliderRow)
    slider.type = "range"
    slider.min = "1"
    slider.max = "10"
    slider.value = String(currentWidth)
    slider.style.width = "68px"

    L.DomEvent.on(slider, "input", () =>
    {
      currentWidth = Number(slider.value)
      sliderLabel.textContent = `Line width: ${currentWidth}`
      applyDrawStyle()
    })

    L.DomEvent.on(toggleButton, "click", (event) =>
    {
      L.DomEvent.stop(event)
      panel.style.display = panel.style.display === "none" ? "flex" : "none"
    })

    applyDrawStyle()

    return container
  },

})