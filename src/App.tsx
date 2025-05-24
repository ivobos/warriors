import React, { useState, useEffect } from 'react'
import './App.css'

type FurColor = 'brown' | 'black' | 'white' | 'gray'
type Accessory = 'flower' | 'leaf' | 'scratched' | 'none'
type HuntingAction = 'unsheathe' | 'crouch' | 'stalk' | 'pounce'
type PreyType = 'rabbit' | 'bird' | 'mouse'

interface CatCustomization {
  furColor: FurColor
  leftEar: Accessory
  rightEar: Accessory
}

interface Position {
  x: number
  y: number
}

interface Prey {
  type: PreyType
  x: number
  y: number
  scentTrail: Array<{ x: number; y: number; age: number }>
  isVisible: boolean
  isKilled: boolean
}

interface InventoryItem {
  type: PreyType
  count: number
  slot: number
}

interface BuriedPrey {
  type: PreyType
  x: number
  y: number
}

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false)
  const [showCustomization, setShowCustomization] = useState(false)
  const [catCustomization, setCatCustomization] = useState<CatCustomization>({
    furColor: 'brown',
    leftEar: 'none',
    rightEar: 'none'
  })
  const [catPosition, setCatPosition] = useState<Position>({ x: 50, y: 50 })
  const [catDirection, setCatDirection] = useState<'left' | 'right'>('right')
  const [targetPosition, setTargetPosition] = useState<Position | null>(null)
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
  const [terrainElements, setTerrainElements] = useState<Array<{
    type: 'tree' | 'bush' | 'rock'
    x: number
    y: number
    size: number
  }>>([])

  const [snowflakes, setSnowflakes] = useState<Array<{
    x: number
    y: number
    size: number
    speed: number
  }>>([])

  const [prey, setPrey] = useState<Prey[]>([])
  const [nearbyPrey, setNearbyPrey] = useState<Prey | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [buriedPrey, setBuriedPrey] = useState<BuriedPrey[]>([])
  const [isDigging, setIsDigging] = useState(false)
  const MAX_INVENTORY_SLOTS = 2
  const [nearbyBuried, setNearbyBuried] = useState<BuriedPrey | null>(null)
  const RETRIEVAL_DISTANCE = 15 // Distance in percentage points
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if (gameStarted) {
      let targetX = catPosition.x
      let targetY = catPosition.y

      // Handle keyboard controls
      const handleKeyDown = (e: KeyboardEvent) => {
        const step = 5 // How far to move in one keypress
        switch (e.key) {
          case 'ArrowUp':
            targetY = Math.max(10, catPosition.y - step)
            break
          case 'ArrowDown':
            targetY = Math.min(90, catPosition.y + step)
            break
          case 'ArrowLeft':
            targetX = Math.max(10, catPosition.x - step)
            setCatDirection('left')
            break
          case 'ArrowRight':
            targetX = Math.min(90, catPosition.x + step)
            setCatDirection('right')
            break
          case 'k':
            if (nearbyPrey && huntingState.clawsOut) {
              handleKillPrey()
            }
            break
          case 'b':
            if (inventory.length > 0 || nearbyBuried) {
              handleDig()
            }
            break
        }
        setTargetPosition({ x: targetX, y: targetY })
      }

      window.addEventListener('keydown', handleKeyDown)

      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [gameStarted, catPosition, nearbyPrey, huntingState.clawsOut, inventory.length, nearbyBuried])

  useEffect(() => {
    if (gameStarted && targetPosition) {
      const moveSpeed = 0.5 // Speed in percentage points per frame
      const moveInterval = setInterval(() => {
        setCatPosition(prev => {
          const dx = targetPosition.x - prev.x
          const dy = targetPosition.y - prev.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < moveSpeed) {
            // If we're very close to the target, just set the final position
            setTargetPosition(null)
            return targetPosition
          }

          // Calculate the direction vector
          const dirX = dx / distance
          const dirY = dy / distance

          // Move in the direction of the target at constant speed
          const newX = prev.x + dirX * moveSpeed
          const newY = prev.y + dirY * moveSpeed

          // Update cat direction based on movement
          setCatDirection(dirX < 0 ? 'left' : 'right')

          return {
            x: Math.max(10, Math.min(90, newX)),
            y: Math.max(10, Math.min(90, newY))
          }
        })
      }, 16) // Approximately 60 FPS

      return () => clearInterval(moveInterval)
    }
  }, [gameStarted, targetPosition])

  useEffect(() => {
    if (gameStarted) {
      // Handle touch events for mobile
      const handleTouchMove = (e: Event) => {
        const touchEvent = e as TouchEvent
        touchEvent.preventDefault()
        const touch = touchEvent.touches[0]
        const rect = (touchEvent.target as HTMLElement).getBoundingClientRect()
        const x = ((touch.clientX - rect.left) / rect.width) * 100
        const y = ((touch.clientY - rect.top) / rect.height) * 100
        
        setCatPosition({ x, y })
        setCatDirection(x < catPosition.x ? 'left' : 'right')
      }

      const gameScene = document.querySelector('.forest-background')
      if (gameScene) {
        gameScene.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false })
      }

      // Generate terrain elements
      const elements = []
      for (let i = 0; i < 15; i++) {
        elements.push({
          type: ['tree', 'bush', 'rock'][Math.floor(Math.random() * 3)] as 'tree' | 'bush' | 'rock',
          x: Math.random() * 100,
          y: Math.random() * 30 + 70, // Keep elements in bottom 30% of screen
          size: 0.8 + Math.random() * 0.4 // Random size between 0.8 and 1.2
        })
      }
      setTerrainElements(elements)

      // Generate snowflakes
      const flakes = []
      for (let i = 0; i < 20; i++) {
        flakes.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 0.5 + Math.random() * 1,
          speed: 1 + Math.random() * 2
        })
      }
      setSnowflakes(flakes)

      // Animate snowflakes
      const snowInterval = setInterval(() => {
        setSnowflakes(prev => prev.map(flake => ({
          ...flake,
          y: flake.y + flake.speed,
          x: flake.x + Math.sin(flake.y * 0.1) * 0.5 // Gentle side-to-side movement
        })).map(flake => ({
          ...flake,
          y: flake.y > 100 ? -10 : flake.y,
          x: flake.x < 0 ? 100 : flake.x > 100 ? 0 : flake.x
        })))
      }, 50)

      // Generate initial prey
      const initialPrey: Prey[] = [
        {
          type: 'rabbit',
          x: 20,
          y: 80,
          scentTrail: Array(10).fill(null).map((_, i) => ({
            x: 20 - i * 0.5,
            y: 80,
            age: i
          })),
          isVisible: true,
          isKilled: false
        },
        {
          type: 'bird',
          x: 70,
          y: 30,
          scentTrail: Array(10).fill(null).map((_, i) => ({
            x: 70 - i * 0.5,
            y: 30,
            age: i
          })),
          isVisible: true,
          isKilled: false
        },
        {
          type: 'mouse',
          x: 30,
          y: 60,
          scentTrail: Array(10).fill(null).map((_, i) => ({
            x: 30 - i * 0.5,
            y: 60,
            age: i
          })),
          isVisible: true,
          isKilled: false
        }
      ]
      setPrey(initialPrey)

      // Age scent trails
      const scentInterval = setInterval(() => {
        setPrey(prevPrey => prevPrey.map(p => ({
          ...p,
          scentTrail: p.scentTrail.map(scent => ({
            ...scent,
            age: scent.age + 1
          }))
        })))
      }, 1000)

      return () => {
        if (gameScene) {
          gameScene.removeEventListener('touchmove', handleTouchMove as EventListener)
        }
        clearInterval(snowInterval)
        clearInterval(scentInterval)
      }
    }
  }, [gameStarted, catPosition])

  useEffect(() => {
    if (gameStarted) {
      // Update prey positions when player is nearby
      const preyInterval = setInterval(() => {
        setPrey(prevPrey => prevPrey.map(p => {
          if (!p.isVisible || p.isKilled) return p

          const dx = p.x - catPosition.x
          const dy = p.y - catPosition.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Only move if player is within hunting range (10% of screen)
          if (distance < 10) {
            // Move away from player
            const moveSpeed = 0.3 // Slower than player movement
            const dirX = dx / distance
            const dirY = dy / distance

            // Add some randomness to movement
            const randomAngle = (Math.random() - 0.5) * 0.5
            const newDirX = dirX * Math.cos(randomAngle) - dirY * Math.sin(randomAngle)
            const newDirY = dirX * Math.sin(randomAngle) + dirY * Math.cos(randomAngle)

            const newX = p.x + newDirX * moveSpeed
            const newY = p.y + newDirY * moveSpeed

            // Keep prey within bounds and update scent trail
            return {
              ...p,
              x: Math.max(10, Math.min(90, newX)),
              y: Math.max(10, Math.min(90, newY)),
              scentTrail: [
                { x: newX, y: newY, age: 0 },
                ...p.scentTrail.slice(0, 9)
              ]
            }
          }
          return p
        }))
      }, 100) // Update prey position every 100ms

      return () => clearInterval(preyInterval)
    }
  }, [gameStarted, catPosition])

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
        setHuntingState(prev => ({ ...prev, isPouncing: true }))
        // If pouncing near prey, increase kill chance
        if (nearbyPrey) {
          const dx = nearbyPrey.x - catPosition.x
          const dy = nearbyPrey.y - catPosition.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // If very close during pounce, auto-kill
          if (distance < 5) {
            handleKillPrey()
          }
        }
        setTimeout(() => {
          setHuntingState({
            clawsOut: false,
            isCrouched: false,
            isStalking: false,
            isPouncing: false
          })
        }, 500)
        break
    }
  }

  const handlePositionClick = (x: number, y: number) => {
    setTargetPosition({ x, y })
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

  const checkPreyDistance = () => {
    if (!prey.length) return null
    
    const nearby = prey.find(p => {
      const dx = p.x - catPosition.x
      const dy = p.y - catPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < 10 // Within 10% of screen distance
    })
    
    setNearbyPrey(nearby || null)
  }

  const addToInventory = (preyType: PreyType) => {
    setInventory(prev => {
      // Find the first empty slot
      const usedSlots = prev.map(item => item.slot)
      const emptySlot = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => i)
        .find(slot => !usedSlots.includes(slot))

      if (emptySlot === undefined) {
        return prev // No empty slots available
      }

      // Add new item to the first empty slot
      return [...prev, { type: preyType, count: 1, slot: emptySlot }]
    })
  }

  const checkBuriedPreyDistance = () => {
    if (!buriedPrey.length) {
      setNearbyBuried(null)
      return
    }
    
    const closest = buriedPrey.reduce((closest, current) => {
      const closestDist = Math.sqrt(
        Math.pow(closest.x - catPosition.x, 2) + 
        Math.pow(closest.y - catPosition.y, 2)
      )
      const currentDist = Math.sqrt(
        Math.pow(current.x - catPosition.x, 2) + 
        Math.pow(current.y - catPosition.y, 2)
      )
      return currentDist < closestDist ? current : closest
    }, buriedPrey[0])

    const distance = Math.sqrt(
      Math.pow(closest.x - catPosition.x, 2) + 
      Math.pow(closest.y - catPosition.y, 2)
    )

    setNearbyBuried(distance <= RETRIEVAL_DISTANCE ? closest : null)
  }

  useEffect(() => {
    if (gameStarted) {
      checkPreyDistance()
      checkBuriedPreyDistance()
    }
  }, [gameStarted, catPosition, prey, buriedPrey])

  const handleDig = () => {
    if (inventory.length === 0 && buriedPrey.length === 0) return
    
    setIsDigging(true)
    setTimeout(() => {
      if (inventory.length > 0) {
        // Bury the first item in inventory
        const itemToBury = inventory[0]
        setBuriedPrey(prev => [...prev, { 
          type: itemToBury.type,
          x: catPosition.x,
          y: catPosition.y
        }])
        // Remove the buried item from inventory
        setInventory(prev => prev.filter(item => item.slot !== itemToBury.slot))
      } else if (nearbyBuried) {
        // Find first empty slot
        const usedSlots = inventory.map(item => item.slot)
        const emptySlot = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => i)
          .find(slot => !usedSlots.includes(slot))
        
        if (emptySlot !== undefined) {
          setInventory(prev => [...prev, { 
            type: nearbyBuried.type, 
            count: 1, 
            slot: emptySlot 
          }])
          // Remove the retrieved prey from buried list
          setBuriedPrey(prev => prev.filter(p => 
            p.x !== nearbyBuried.x || p.y !== nearbyBuried.y
          ))
        }
      }
      setIsDigging(false)
    }, 1000)
  }

  const handleKillPrey = () => {
    if (!nearbyPrey || !huntingState.clawsOut) return
    
    const totalItems = inventory.length
    
    if (totalItems < MAX_INVENTORY_SLOTS) {
      addToInventory(nearbyPrey.type)
      // Remove the killed prey from the prey array
      setPrey(prevPrey => prevPrey.filter(p => p !== nearbyPrey))
      setNearbyPrey(null)
    }
  }

  const renderInventory = () => (
    <div className="inventory">
      <h3>Inventory</h3>
      <div className="inventory-items">
        {Array.from({ length: MAX_INVENTORY_SLOTS }).map((_, index) => {
          const item = inventory.find(item => item.slot === index)
          return item ? (
            <div key={index} className="inventory-item">
              <span className="prey-emoji">
                {item.type === 'rabbit' && '🐰'}
                {item.type === 'bird' && '🐦'}
                {item.type === 'mouse' && '🐭'}
              </span>
            </div>
          ) : (
            <div key={index} className="inventory-slot empty" />
          )
        })}
      </div>
      {buriedPrey.length > 0 && (
        <div className="buried-prey">
          <h4>Buried: {buriedPrey.map(p => `${p.type}`).join(', ')}</h4>
        </div>
      )}
    </div>
  )

  const renderInstructions = () => (
    <div className="instructions-overlay">
      <div className="instructions-content">
        <h2>How to Play</h2>
        <div className="instructions-section">
          <h3>Movement</h3>
          <ul>
            <li>Click/tap anywhere to move your cat</li>
            <li>Use arrow keys to move in small steps</li>
          </ul>
        </div>
        <div className="instructions-section">
          <h3>Hunting</h3>
          <ul>
            <li>Move close to prey (within 10% distance)</li>
            <li>Use hunting actions to prepare for the kill</li>
            <li>Press 'K' or click "Kill" when close to prey</li>
            <li>Remember to unsheathe your claws first!</li>
            <li>Prey will go into your inventory (max 2 slots)</li>
          </ul>
        </div>
        <div className="instructions-section">
          <h3>Burying & Retrieving</h3>
          <ul>
            <li>Press 'B' or click "Dig" to bury prey from inventory</li>
            <li>A marker (🕳️) will show where you buried it</li>
            <li>Move close to a marker to retrieve (within 15% distance)</li>
            <li>Press 'B' or click "Dig" when near a marker to retrieve the prey</li>
          </ul>
        </div>
        <button 
          className="close-instructions"
          onClick={() => setShowInstructions(false)}
        >
          Got it!
        </button>
      </div>
    </div>
  )

  const renderGameScene = () => (
    <div className="game-scene">
      <div 
        className="forest-background"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          handlePositionClick(x, y)
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((touch.clientX - rect.left) / rect.width) * 100
          const y = ((touch.clientY - rect.top) / rect.height) * 100
          handlePositionClick(x, y)
        }}
      >
        {/* Background layer with terrain */}
        <div className="terrain-layer" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0,
          bottom: 0,
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden'
        }}>
          {terrainElements.map((element, index) => (
            <div
              key={`${element.type}-${index}`}
              className={element.type}
              style={{
                position: 'absolute',
                left: `${element.x}%`,
                bottom: `${element.y}%`,
                transform: `scale(${element.size})`,
                transformOrigin: 'bottom center'
              }}
            />
          ))}
        </div>

        {/* Burial Markers Layer */}
        <div className="burial-layer" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          zIndex: 2
        }}>
          {buriedPrey.map((buried, index) => (
            <div
              key={`buried-${index}`}
              className={`burial-marker ${buried === nearbyBuried ? 'nearby' : ''}`}
              style={{
                position: 'absolute',
                left: `${buried.x}%`,
                top: `${buried.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {buried.type === 'rabbit' && '🕳️🐰'}
              {buried.type === 'bird' && '🕳️🐦'}
              {buried.type === 'mouse' && '🕳️🐭'}
            </div>
          ))}
        </div>

        {/* Prey and Scent Layer */}
        <div className="prey-layer" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          zIndex: 3
        }}>
          {prey.map((p, index) => (
            <div key={`prey-${index}`}>
              {/* Scent Trail */}
              {p.scentTrail.map((scent, sIndex) => (
                <div
                  key={`scent-${index}-${sIndex}`}
                  className={`scent-trail ${p.type}`}
                  style={{
                    position: 'absolute',
                    left: `${scent.x}%`,
                    top: `${scent.y}%`,
                    opacity: Math.max(0, 1 - scent.age * 0.1)
                  }}
                />
              ))}
              {/* Prey Animal */}
              {p.isVisible && (
                <div
                  className={`prey ${p.type}`}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: '24px'
                  }}
                >
                  {p.type === 'rabbit' && '🐰'}
                  {p.type === 'bird' && '🐦'}
                  {p.type === 'mouse' && '🐭'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Snow layer */}
        <div className="snow-layer" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          zIndex: 4
        }}>
          {snowflakes.map((flake, index) => (
            <div
              key={`snowflake-${index}`}
              className="snowflake"
              style={{
                left: `${flake.x}%`,
                top: `${flake.y}%`,
                fontSize: `${flake.size}rem`,
                animationDuration: `${10 / flake.speed}s`
              }}
            >
              ❄
            </div>
          ))}
        </div>

        {/* Cat layer */}
        <div 
          className={`cat ${`cat-fur-${catCustomization.furColor}`} ${catDirection} ${
            huntingState.clawsOut ? 'claws-out' : ''
          } ${huntingState.isCrouched ? 'crouched' : ''} ${
            huntingState.isStalking ? 'stalking' : ''
          } ${huntingState.isPouncing ? 'pouncing' : ''}`}
          style={{
            position: 'absolute',
            left: `${catPosition.x}%`,
            top: `${catPosition.y}%`,
            zIndex: 5
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
      <div className="hunting-actions">
        <button 
          className="hunting-button instructions"
          onClick={() => setShowInstructions(true)}
        >
          How to Play
        </button>
        <button 
          className={`hunting-button ${huntingState.clawsOut ? 'active' : ''}`}
          onClick={() => handleHuntingAction('unsheathe')}
          onTouchStart={(e) => {
            e.preventDefault()
            handleHuntingAction('unsheathe')
          }}
        >
          Unsheathe
        </button>
        <button 
          className={`hunting-button ${huntingState.isCrouched ? 'active' : ''}`}
          onClick={() => handleHuntingAction('crouch')}
          onTouchStart={(e) => {
            e.preventDefault()
            handleHuntingAction('crouch')
          }}
        >
          Crouch
        </button>
        <button 
          className={`hunting-button ${huntingState.isStalking ? 'active' : ''}`}
          onClick={() => handleHuntingAction('stalk')}
          onTouchStart={(e) => {
            e.preventDefault()
            handleHuntingAction('stalk')
          }}
        >
          Stalk
        </button>
        <button 
          className={`hunting-button pounce ${huntingState.isPouncing ? 'active' : ''}`}
          onClick={() => handleHuntingAction('pounce')}
          onTouchStart={(e) => {
            e.preventDefault()
            handleHuntingAction('pounce')
          }}
        >
          Pounce
        </button>
        <button
          className={`hunting-button dig ${isDigging ? 'active' : ''} ${nearbyBuried ? 'can-retrieve' : ''}`}
          onClick={handleDig}
          onTouchStart={(e) => {
            e.preventDefault()
            handleDig()
          }}
        >
          {inventory.length > 0 ? 'Bury' : nearbyBuried ? 'Retrieve' : 'Dig'}
        </button>
        {nearbyPrey && (
          <button
            className="hunting-button kill"
            onClick={handleKillPrey}
            onTouchStart={(e) => {
              e.preventDefault()
              handleKillPrey()
            }}
          >
            Kill {nearbyPrey.type}
          </button>
        )}
      </div>
      {renderInventory()}
      {showInstructions && renderInstructions()}
    </div>
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>Warriors Game</h1>
      </header>
      <main className="game-container">
        <div className="game-board">
          {!gameStarted ? (
            <>
              <h2>Welcome to Warriors!</h2>
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