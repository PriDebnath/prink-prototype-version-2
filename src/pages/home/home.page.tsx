import { Link } from "@tanstack/react-router"
import { CANVAS_PRESETS } from "../canvas/presets"



export default function Index() {
  const cards = Object.keys(CANVAS_PRESETS).map((id) => ({
    id,
    name: id,
    description: "Preset canvas",
  }))
  return (
    <div id="home-page">
      <h1>Prink</h1>

      <div className="cards-container">
        {cards.map((card) => {
          return (
            <Link to="/canvas/$canvasId"
              params={{ canvasId: String(card.id) }}
              key={"card-link-" + card.id}>
              <div className="card" key={"card-" + card.id}>
                <h2>{card.name}</h2>
                <p>{card.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}