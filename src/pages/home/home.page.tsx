import { Link } from "@tanstack/react-router"



export default function Index() {
  const cards = [
    {
      id: 1,
      name: 'Card 1',
      description: 'Description 1',
    },
    {
      id: 2,
      name: 'Card 2',
      description: 'Description 2',
    },
    {
      id: 3,
      name: 'Card 3',
      description: 'Description 3',
    },
  ]
  return (
    <div id="home-page">
      <h1>Apricity</h1>

      <div className="cards-container">
        {cards.map((card) => {
          return (
            <Link to="/canvas/$canvasId"
              params={{ canvasId: card.id.toString() }}
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