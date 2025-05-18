import React, { useState, useEffect } from 'react'
import './App.css'

type FurColor = 'brown' | 'black' | 'white' | 'gray'
type Accessory = 'flower' | 'leaf' | 'scratched' | 'none'
type HuntingAction = 'unsheathe' | 'crouch' | 'stalk' | 'pounce'

interface CatCustomization {
  furColor: FurColor
  leftEar: Accessory
  rightEar: Accessory
}

interface ScentTrail {
  id: number
  x: number
  y: number
  type: 'mouse' | 'rabbit' | 'bird'
  strength: number
  age: number
  direction: number // angle in radians
  speed: number
}

interface Position {
  x: number
  y: number
}

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false)
  const [showCustomization, setShowCustomization] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [catCustomization, setCatCustomization] = useState<CatCustomization>({
    furColor: 'brown',
    leftEar: 'none',
    rightEar: 'none'
  })
  const [scentTrails, setScentTrails] = useState<ScentTrail[]>([])
  const [snowflakes, setSnowflakes] = useState<{ id: number; x: number; y: number }[]>([])
  const [catPosition, setCatPosition] = useState<Position>({ x: 50, y: 50 })
  const [catDirection, setCatDirection] = useState<'left' | 'right'>('right')
  const [nearbyPrey, setNearbyPrey] = useState<ScentTrail | null>(null)
  const [huntingState, setHuntingState] = useState<{
    clawsOut: boolean
    isCrouched: boolean
    isStalking: boolean
    isPouncing: boolean
  }>({
    clawsOut: false,
    isCrouched: false,
    isStalking: false,
    isPouncing: false
  })

  useEffect(() => {
    if (gameStarted) {
      // Generate initial scent trails
      const initialTrails: ScentTrail[] = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10, // 10-90%
        y: Math.random() * 80 + 10,
        type: ['mouse', 'rabbit', 'bird'][Math.floor(Math.random() * 3)] as 'mouse' | 'rabbit' | 'bird',
        strength: 1.0,
        age: 0,
        direction: Math.random() * Math.PI * 2, // random direction
        speed: 0.00000000000000005 // extremely small movement speed
      }))
      setScentTrails(initialTrails)

      // Generate snowflakes
      const initialSnowflakes = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      }))
      setSnowflakes(initialSnowflakes)

      // Animate snow
      const snowInterval = setInterval(() => {
        setSnowflakes(prev => 
          prev.map(flake => ({
            ...flake,
            y: flake.y > 100 ? 0 : flake.y + 0.5,
            x: flake.x + Math.sin(flake.y * 0.1) * 0.5
          }))
        )
      }, 50)

      // Update scent trails - extremely slow movement and fade
      const scentInterval = setInterval(() => {
        setScentTrails(prev => 
          prev.map(trail => {
            // Calculate new position based on direction and speed
            const newX = Math.max(10, Math.min(90, trail.x + Math.cos(trail.direction) * trail.speed))
            const newY = Math.max(10, Math.min(90, trail.y + Math.sin(trail.direction) * trail.speed))
            
            // Change direction very rarely and very subtly
            const newDirection = trail.age % 500 === 0 
              ? trail.direction + (Math.random() - 0.5) * 0.1 
              : trail.direction

            return {
              ...trail,
              x: newX,
              y: newY,
              direction: newDirection,
              strength: Math.max(0, trail.strength - 0.00001),
              age: trail.age + 1
            }
          }).filter(trail => trail.strength > 0)
        )
      }, 1000)

      // Handle keyboard controls - back to normal speed
      const handleKeyDown = (e: KeyboardEvent) => {
        const moveSpeed = 1 // Back to normal speed
        setCatPosition(prev => {
          let newX = prev.x
          let newY = prev.y

          switch (e.key) {
            case 'ArrowUp':
              newY = Math.max(10, prev.y - moveSpeed)
              break
            case 'ArrowDown':
              newY = Math.min(90, prev.y + moveSpeed)
              break
            case 'ArrowLeft':
              newX = Math.max(10, prev.x - moveSpeed)
              setCatDirection('left')
              break
            case 'ArrowRight':
              newX = Math.min(90, prev.x + moveSpeed)
              setCatDirection('right')
              break
          }

          return { x: newX, y: newY }
        })
      }

      window.addEventListener('keydown', handleKeyDown)

      // Check for nearby prey
      const checkNearbyPrey = () => {
        const PREY_DETECTION_RADIUS = 15 // percentage of screen
        const nearby = scentTrails.find(trail => {
          const dx = Math.abs(trail.x - catPosition.x)
          const dy = Math.abs(trail.y - catPosition.y)
          return dx < PREY_DETECTION_RADIUS && dy < PREY_DETECTION_RADIUS
        })
        setNearbyPrey(nearby || null)
      }

      const preyCheckInterval = setInterval(checkNearbyPrey, 100)

      return () => {
        clearInterval(snowInterval)
        clearInterval(scentInterval)
        clearInterval(preyCheckInterval)
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [gameStarted, catPosition, scentTrails])

  const handleStartGame = () => {
    setGameStarted(true)
  }

  const handleCustomize = () => {
    setShowCustomization(true)
  }

  const handleFurColorChange = (color: FurColor) => {
    setCatCustomization(prev => ({ ...prev, furColor: color }))
  }

  const handleAccessoryChange = (ear: 'leftEar' | 'rightEar', accessory: Accessory) => {
    setCatCustomization(prev => ({ ...prev, [ear]: accessory }))
  }

  const handleHuntingAction = (action: HuntingAction) => {
    switch (action) {
      case 'unsheathe':
        setHuntingState(prev => ({ ...prev, clawsOut: !prev.clawsOut }))
        break
      case 'crouch':
        setHuntingState(prev => ({ ...prev, isCrouched: !prev.isCrouched }))
        break
      case 'stalk':
        setHuntingState(prev => ({ ...prev, isStalking: !prev.isStalking }))
        break
      case 'pounce':
        if (nearbyPrey && huntingState.clawsOut && huntingState.isCrouched && huntingState.isStalking) {
          setHuntingState(prev => ({ ...prev, isPouncing: true }))
          // Wait for pounce animation to complete before removing prey
          setTimeout(() => {
            setScentTrails(prev => prev.filter(trail => trail.id !== nearbyPrey.id))
            setHuntingState({
              clawsOut: false,
              isCrouched: false,
              isStalking: false,
              isPouncing: false
            })
          }, 500) // Match this with the pounce animation duration
        }
        break
    }
  }

  const renderCatPreview = () => {
    const furColorClass = `cat-fur-${catCustomization.furColor}`
    const leftEarClass = `cat-ear-${catCustomization.leftEar}`
    const rightEarClass = `cat-ear-${catCustomization.rightEar}`

    return (
      <div className="cat-preview">
        <div className={`cat ${furColorClass}`}>
          <div className="cat-ears">
            <div className={`cat-ear left ${leftEarClass}`}></div>
            <div className={`cat-ear right ${rightEarClass}`}></div>
          </div>
          <div className="cat-face">
            <div className="cat-eyes"></div>
            <div className="cat-nose"></div>
            <div className="cat-mouth"></div>
          </div>
        </div>
      </div>
    )
  }

  const renderGameScene = () => (
    <div className="game-scene">
      <div 
        className="forest-background"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setCatPosition({ x, y });
          // Update cat direction based on movement
          setCatDirection(x < catPosition.x ? 'left' : 'right');
        }}
      >
        {snowflakes.map(flake => (
          <div
            key={flake.id}
            className="snowflake"
            style={{
              left: `${flake.x}%`,
              top: `${flake.y}%`
            }}
          />
        ))}
        {/* Trees */}
        <div className="tree" style={{ left: '10%' }} />
        <div className="tree" style={{ left: '30%' }} />
        <div className="tree" style={{ left: '70%' }} />
        <div className="tree" style={{ left: '85%' }} />
        
        {/* Bushes */}
        <div className="bush" style={{ left: '20%' }} />
        <div className="bush" style={{ left: '45%' }} />
        <div className="bush" style={{ left: '60%' }} />
        <div className="bush" style={{ left: '80%' }} />
        
        {/* Rocks */}
        <div className="rock" style={{ left: '25%' }} />
        <div className="rock" style={{ left: '55%' }} />
        <div className="rock" style={{ left: '75%' }} />
        
        {scentTrails.map(trail => (
          <div
            key={trail.id}
            className={`scent-trail ${trail.type}`}
            style={{
              left: `${trail.x}%`,
              top: `${trail.y}%`,
              opacity: trail.strength
            }}
          >
            <div className="scent-icon">
              {trail.type === 'mouse' && '🐁'}
              {trail.type === 'rabbit' && '🐰'}
              {trail.type === 'bird' && '🐦'}
            </div>
          </div>
        ))}
        <div 
          className={`cat ${`cat-fur-${catCustomization.furColor}`} ${catDirection} ${
            huntingState.clawsOut ? 'claws-out' : ''
          } ${huntingState.isCrouched ? 'crouched' : ''} ${
            huntingState.isStalking ? 'stalking' : ''
          } ${huntingState.isPouncing ? 'pouncing' : ''}`}
          style={{
            left: `${catPosition.x}%`,
            top: `${catPosition.y}%`
          }}
        >
          <div className="cat-ears">
            <div className={`cat-ear left ${`cat-ear-${catCustomization.leftEar}`}`}></div>
            <div className={`cat-ear right ${`cat-ear-${catCustomization.rightEar}`}`}></div>
          </div>
          <div className="cat-face">
            <div className="cat-eyes"></div>
            <div className="cat-nose"></div>
            <div className="cat-mouth"></div>
          </div>
        </div>
      </div>
      {showInstructions ? (
        <div className="hunting-info" onClick={() => setShowInstructions(false)}>
          <h3>ThunderClan Territory - Leaf-bare</h3>
          <p>As a ThunderClan warrior, you must hunt to feed your Clan during the harsh leaf-bare season.</p>
          <div className="hunting-instructions">
            <h4>Hunting Instructions:</h4>
            <ol>
              <li>Use arrow keys to move through the forest</li>
              <li>Follow the scent trails (they fade over time)</li>
              <li>When near prey, prepare to hunt:</li>
              <ul>
                <li>Unsheathe your claws</li>
                <li>Crouch down</li>
                <li>Stalk your prey</li>
                <li>Pounce when ready!</li>
              </ul>
            </ol>
          </div>
          <div className="scent-legend">
            <div className="legend-item">
              <span className="scent-icon">🐁</span> Mouse (Easiest)
            </div>
            <div className="legend-item">
              <span className="scent-icon">🐰</span> Rabbit (Medium)
            </div>
            <div className="legend-item">
              <span className="scent-icon">🐦</span> Bird (Hardest)
            </div>
          </div>
          <div className="instructions-hint">Click anywhere to dismiss</div>
        </div>
      ) : (
        <button 
          className="show-instructions-button"
          onClick={() => setShowInstructions(true)}
        >
          Show Instructions
        </button>
      )}
      {nearbyPrey && (
        <div className="hunting-actions">
          <button 
            className={`hunting-button ${huntingState.clawsOut ? 'active' : ''}`}
            onClick={() => handleHuntingAction('unsheathe')}
          >
            Unsheathe Claws
          </button>
          <button 
            className={`hunting-button ${huntingState.isCrouched ? 'active' : ''}`}
            onClick={() => handleHuntingAction('crouch')}
          >
            Crouch
          </button>
          <button 
            className={`hunting-button ${huntingState.isStalking ? 'active' : ''}`}
            onClick={() => handleHuntingAction('stalk')}
          >
            Stalk
          </button>
          <button 
            className={`hunting-button pounce ${huntingState.isPouncing ? 'active' : ''}`}
            onClick={() => handleHuntingAction('pounce')}
            disabled={!huntingState.clawsOut || !huntingState.isCrouched || !huntingState.isStalking}
          >
            Pounce
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>Warriors Game</h1>
      </header>
      <main className="game-container">
        <div className="game-board">
          <h2>Welcome to Warriors!</h2>
          {!gameStarted ? (
            <>
              <p>Your epic adventure begins here...</p>
              {!showCustomization ? (
                <div className="button-container">
                  <button className="customize-button" onClick={handleCustomize}>
                    Customize Your Cat
                  </button>
                  <button className="start-button" onClick={handleStartGame}>
                    Start Game
                  </button>
                </div>
              ) : (
                <div className="customization-menu">
                  <h3>Customize Your Cat</h3>
                  {renderCatPreview()}
                  <div className="customization-options">
                    <div className="option-group">
                      <h4>Fur Color</h4>
                      <div className="color-options">
                        {['brown', 'black', 'white', 'gray'].map((color) => (
                          <button
                            key={color}
                            className={`color-button ${color} ${catCustomization.furColor === color ? 'selected' : ''}`}
                            onClick={() => handleFurColorChange(color as FurColor)}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="option-group">
                      <h4>Left Ear</h4>
                      <div className="accessory-options">
                        {['none', 'flower', 'leaf', 'scratched'].map((accessory) => (
                          <button
                            key={accessory}
                            className={`accessory-button ${catCustomization.leftEar === accessory ? 'selected' : ''}`}
                            onClick={() => handleAccessoryChange('leftEar', accessory as Accessory)}
                          >
                            {accessory}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="option-group">
                      <h4>Right Ear</h4>
                      <div className="accessory-options">
                        {['none', 'flower', 'leaf', 'scratched'].map((accessory) => (
                          <button
                            key={accessory}
                            className={`accessory-button ${catCustomization.rightEar === accessory ? 'selected' : ''}`}
                            onClick={() => handleAccessoryChange('rightEar', accessory as Accessory)}
                          >
                            {accessory}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="start-button" onClick={handleStartGame}>
                    Start Game
                  </button>
                </div>
              )}
            </>
          ) : (
            renderGameScene()
          )}
        </div>
      </main>
    </div>
  )
}

export default App 