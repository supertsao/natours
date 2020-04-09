export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic3VwZXJsdW4iLCJhIjoiY2s4Y3B1ZWJmMGo2dzNscWV3eWc1cWdmZCJ9.99pRtW9wQoYp9LYfXXK4NA'
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/superlun/ck8cqafg32bng1ik9xdpbttir',
    scrollZoom: false
    //   center: [-118.113491, 34.111745],
    //   zoom: 4
  })
  const bounds = new mapboxgl.LngLatBounds()

  locations.forEach(loc => {
    // add marker
    const el = document.createElement('div')
    el.className = 'marker'

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map)

    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`Day ${loc.day}: ${loc.description}`)
      .addTo(map)

    bounds.extend(loc.coordinates)
  })

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      left: 100,
      right: 100,
      bottom: 100
    }
  })
}
