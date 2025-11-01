import { Link, useNavigate } from "@tanstack/react-router"
import { CANVAS_PRESETS } from "../canvas/presets"
import { storage, type SavedPrink } from "../../utils/storage"
import { useState, useEffect } from "react"

export default function Index() {
  const navigate = useNavigate();
  const [savedPrinks, setSavedPrinks] = useState<SavedPrink[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // Load saved prinks
  useEffect(() => {
    const loadPrinks = () => {
      setSavedPrinks(storage.getAllPrinks());
    };
    loadPrinks();
    
    // Listen for storage changes (cross-tab updates)
    const handleStorageChange = () => {
      loadPrinks();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom prink-saved events (same-tab updates)
    const handlePrinkSaved = () => {
      loadPrinks();
    };
    window.addEventListener('prink-saved', handlePrinkSaved);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('prink-saved', handlePrinkSaved);
    };
  }, []);

  const handleCreateNew = () => {
    const newId = storage.generateId();
    navigate({ to: '/canvas/$canvasId', params: { canvasId: newId } });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to delete this prink?')) {
      storage.deletePrink(id);
      setSavedPrinks(storage.getAllPrinks());
    }
  };

  const handleStartEdit = (e: React.MouseEvent, prink: SavedPrink) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(prink.id);
    setEditingName(prink.name);
  };

  const handleSaveEdit = (id: string) => {
    const prink = storage.getPrink(id);
    if (prink && editingName.trim()) {
      storage.savePrink({
        ...prink,
        name: editingName.trim(),
      });
      setSavedPrinks(storage.getAllPrinks());
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const presetCards = Object.keys(CANVAS_PRESETS).map((id) => ({
    id,
    name: id,
    description: "Preset canvas",
    type: 'preset' as const,
  }));

  const savedPrinkCards = savedPrinks.map((prink) => ({
    id: prink.id,
    name: prink.name,
    description: `Last updated: ${new Date(prink.updatedAt).toLocaleDateString()}`,
    type: 'saved' as const,
    prink,
  }));

  const allCards = [...presetCards, ...savedPrinkCards];

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
      }}>
        <h1 style={{ margin: '0' }}>Prink</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space)' }}>
          <button
            onClick={handleCreateNew}
            style={{
              padding: 'calc(var(--space) * 2) calc(var(--space) * 4)',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'calc(var(--border-radius) * 0.5)',
              cursor: 'pointer',
              fontSize: 'var(--font-size)',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            + Create New Prink
          </button>
          <p style={{ margin: '0', fontSize: '0.7rem', opacity: 0.7 }}>Deployed: {formattedDate}</p>
        </div>
      </div>

      <div className="cards-container">
        {allCards.map((card) => {
          const isSaved = card.type === 'saved';
          const isEditing = editingId === card.id;
          const prink = isSaved ? card.prink : null;
          
          return (
            <Link to="/canvas/$canvasId"
              params={{ canvasId: String(card.id) }}
              key={"card-link-" + card.id}
              style={{ textDecoration: 'none', position: 'relative' }}
              onClick={(e) => {
                if (isEditing) {
                  e.preventDefault();
                }
              }}>
              <div className="card" key={"card-" + card.id} style={{ position: 'relative' }}>
                {isSaved && !isEditing && (
                  <>
                    <button
                      onClick={(e) => handleStartEdit(e, prink!)}
                      style={{
                        position: 'absolute',
                        top: 'var(--space)',
                        right: 'calc(var(--space) + 32px)',
                        background: 'rgba(37, 99, 235, 0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        lineHeight: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(37, 99, 235, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(37, 99, 235, 0.7)';
                      }}
                      title="Rename prink"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, card.id)}
                      style={{
                        position: 'absolute',
                        top: 'var(--space)',
                        right: 'var(--space)',
                        background: 'rgba(255, 0, 0, 0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        lineHeight: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 0, 0, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 0, 0, 0.7)';
                      }}
                      title="Delete prink"
                    >
                      ×
                    </button>
                  </>
                )}
                {isEditing ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(card.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      onBlur={() => handleSaveEdit(card.id)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: 'calc(var(--space) * 2)',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        border: '2px solid var(--accent)',
                        borderRadius: 'calc(var(--border-radius) * 0.3)',
                        marginBottom: 'calc(var(--space) * 2)',
                        background: 'white',
                      }}
                    />
                  </div>
                ) : (
                  <h2 style={{ margin: '0 0 calc(var(--space) * 2) 0' }}>{card.name}</h2>
                )}
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>{card.description}</p>
              </div>
            </Link>
          )
        })}
        {allCards.length === 0 && (
          <div className="card" style={{ textAlign: 'center', opacity: 0.6 }}>
            <p>No prinks yet. Click "Create New Prink" to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}