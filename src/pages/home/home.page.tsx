import { Link } from "@tanstack/react-router"
import { CANVAS_PRESETS } from "../canvas/presets"



export default function Index() {
  const cards = Object.keys(CANVAS_PRESETS).map((id) => ({
    id,
    name: id,
    description: "Preset canvas",
  }))

  // Format deployment timestamp
  const deploymentTimestamp = typeof __DEPLOYMENT_TIMESTAMP__ !== 'undefined'
    ? __DEPLOYMENT_TIMESTAMP__
    : new Date().toISOString();

  const deploymentDate = new Date(deploymentTimestamp);
  const formattedDate = deploymentDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <div id="home-page">

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space)'
      }}  >
        <h1 style={{ margin: '0' }}>Prink</h1>
        <p>Deployed: {formattedDate}</p>
      </div>

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