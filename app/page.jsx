'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, forwardRef, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from "gsap";
import { Vector3 } from 'three';
import { COLORS, ITP_SET, Notes } from 'utils';
// import * as Tone from 'tone'
import * as Tone from "tone/build/esm/index"; //https://github.com/Tonejs/Tone.js/issues/973

const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })

export default function Page() {
  const [boards, setBoards] = useState([]);
  const [deletables, setDeletables] = useState([])
  const [restart, setRestart] = useState(false)
  const [gesture, setGesture] = useState("move")
  const walkerRef = useRef()
  // Game state
  const [isCompleted, setIsCompleted] = useState(false);
  const [amountOfTilesCompleted, setAmountOfTilesCompleted] = useState(0);
  function createBoards() {
    if (Tone.context.state === 'running') {
      let player = new Tone.Player({
        url: '/sounds/restart.wav',
        autostart: true,
      }).toDestination();
    }
    console.log('create boards function')
    let idx = 0
    const boardArray = []
    const deletables = []
    for (let x = -10; x < 10; x++) {
      for (let y = -10; y < 10; y++) {
        boardArray.push([x, y, 0])
        deletables.push(ITP_SET.has(idx) ? true : false)
        idx++
        //deletables.push(Math.random() > 0.5)
      }
    }
    setBoards(boardArray)
    setDeletables(deletables)
    setTimeout(() => {
      setRestart(false)
    }, 1000)
  }

  const fetchData = async () => {
    const response = await fetch("/");
    const jsonData = await response.json();
    // setState here!
  }

  useEffect(() => {

    // if (amountOfTilesCompleted === amountofRedTiles) setIsCompleted(true);
  }, [amountOfTilesCompleted]);

  useEffect(() => {
    window.addEventListener('click', () => {
      if (Tone.context.state !== 'running') {
        Tone.start()
      }
    });

    createBoards()
    const socket = new WebSocket('ws://localhost:8080');

    socket.addEventListener('open', (event) => {
      console.log('WebSocket connection opened:', event);
    });

    socket.addEventListener('message', (event) => {
      if (Tone.context.state !== 'running') {
        Tone.start()
      }
      const oscMessage = JSON.parse(event.data);
      //console.log('Received OSC message:', oscMessage);
      if (!walkerRef.current) return
      if (oscMessage.address === '/position') {
        const [xPos, yPos, xVelocity, yVelocity] = oscMessage.args
        walkerRef.current.position.x = xPos
        walkerRef.current.position.y = yPos
        if (Math.abs(xVelocity) > Math.abs(yVelocity)) {
          walkerRef.current.direction = xVelocity > 0 ? 'right' : 'left'
          walkerRef.current.speed = xVelocity
          walkerRef.current.absSpeed = Math.abs(xVelocity)
        } else {
          walkerRef.current.direction = yVelocity > 0 ? 'down' : 'up'
          walkerRef.current.speed = yVelocity
          walkerRef.current.absSpeed = Math.abs(yVelocity)
        }
        setGesture("move")
        //if (restart) setRestart(false)
      }

      if (oscMessage.address === '/click') {
        console.log('click', walkerRef.current.selectedCount)
        // if 0 boards has been selected, enable to select
        if (!walkerRef.current.selectedCount) {
          console.log('init select')
          const selectedPosition = new Vector3()
          selectedPosition.copy(walkerRef.current.position);
          walkerRef.current.selectPosition = selectedPosition
          setGesture("click")
        }
      }

      if (oscMessage.address === '/shoot') {
        console.log('shoot', walkerRef.current.selectedCount)
        // if 1 board is selected, either change its color or hide it
        if (walkerRef.current.selectedCount) {
          setGesture("shoot") // change the state
        }
      }

      if (oscMessage.address === '/clap') {
        console.log('clap, restart state', restart)
        if (!restart) {
          setRestart(true)
        }
      }
      // Handle the received OSC message in your React component
    });

    socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed:', event);
    });

    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
    });

    // Cleanup on component unmount
    return () => {
      socket.close();
    };
  }, []);
  useEffect(() => {
    if (restart) {
      console.log('create boards useeffect', restart)
      createBoards()
    }
  }, [restart])

  return (
    <>
      {/* <button onClick={createBoards}>click</button> */}
      <View orbit className='relative h-full  w-full'>
        <Common color={'black'} />
        {boards?.map((board, i) => <Board
          onComplete={setAmountOfTilesCompleted}
          position={board}
          key={i}
          ref={walkerRef}
          gesture={gesture}
          //deletable={ITP_SET.has(i) ? true : false}
          deletable={deletables[i]}
          restart={restart}
          idx={i}
        />)}
        <Walker ref={walkerRef} />
      </View>
    </>
  )
}

const mapSpeedRotation = (speed) => {
  //console.log('speed', speed)
  let level = { count: 1, ducation: 4 }
  if (speed < 100) {
    level = { count: 1, duration: 5 }
  } else if (speed >= 300 && speed < 600) {
    level = { count: 2, duration: 5 }
  } else if (speed > 600) {
    level = { count: 3, duration: 4.5 }
  }
  return level
}

const Board = forwardRef(function (props, walkerRef) {
  const { position, deletable, onComplete, gesture, restart, idx } = props
  const [scale] = useState([0.9, 0.9, 0.2])
  const [color, setColor] = useState(deletable ? '#4d1782' : 'white')
  const [isSelected, setIsSelected] = useState(false)
  const [visible, setVisible] = useState(true)
  const [near, setNear] = useState({ near: false, hover: false })
  const ref = useRef()

  useEffect(() => {
    if (restart) {
      console.log('restart in board')
      setVisible(true)
      setIsSelected(false)
      setColor(deletable ? '#4d1782' : 'white')
      walkerRef.current.selectPosition = null
      walkerRef.current.selectedCount = 0
    }
  }, [restart])

  useEffect(() => {
    if (visible) {
      let player
      if (gesture === 'click' && !walkerRef.current.selectedCount) {
        const boardVec = new Vector3(ref.current.position.x, ref.current.position.y, ref.current.position.z)
        if (boardVec.distanceTo(walkerRef.current.selectPosition) < 0.5) {
          setColor("red")
          setIsSelected(true)
          walkerRef.current.selectedCount = 1
          walkerRef.current.selectPosition = null
          if (Tone.context.state === 'running') {
            player = new Tone.Player({
              url: '/sounds/click.wav',
              autostart: true,
            }).toDestination();
          }
        }
      }

      if (isSelected && gesture === 'shoot') {
        if (deletable) {
          setVisible(false)
          if (Tone.context.state === 'running') {
            player = new Tone.Player({
              url: '/sounds/shoot_delete.wav',
              autostart: true,
            }).toDestination();
          }
        } else {
          const updatedColor = gsap.utils.random(COLORS)
          //console.log('update color', updatedColor)
          //setColor('blue')
          setColor(updatedColor)
          if (Tone.context.state === 'running') {
            player = new Tone.Player({
              url: '/sounds/shoot.wav',
              autostart: true,
            }).toDestination();
          }
        }
        setIsSelected(false)
        walkerRef.current.selectedCount = 0
      }
    }
  }, [gesture])

  useFrame(() => {
    const boardVec = new Vector3(ref.current.position.x, ref.current.position.y, ref.current.position.z)
    const walkerVec = new Vector3(walkerRef.current.position.x, walkerRef.current.position.y, walkerRef.current.position.z)
    const distance = walkerVec.distanceTo(boardVec)
    if (distance < 0.5) {
      // setNear({ near: true, hover: true })
      setNear(prev => ({ ...prev, near: true, hover: true }))

    } else {
      setNear(prev => ({ ...prev, hover: false }))

    }
  })

  useEffect(() => {
    if (!ref.current) return;
    let nearSynth
    if (near.near) {
      if (Tone.context.state === 'running') {
        nearSynth = nearSynth || new Tone.FMSynth({
          oscillator: {
            type: 'sine', // Experiment with different types: 'sine', 'square', 'sawtooth', 'triangle'
          },
          detune: 0,
          harmonicity: 20,
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.3,
            release: 0.25, // Adjust release time for a longer, lingering sound
          },
          modulationEnvelope: {
            attack: 0.1,
            attackCurve: "linear",
            decay: 0.01,
            decayCurve: "exponential",
            release: 0.25,
            releaseCurve: "exponential",
            sustain: 0.5
          },
          modulationIndex: 2.22
        }).toDestination();
        nearSynth.triggerAttackRelease(Notes[idx % Notes.length], '8n')
      }
      const { count, duration } = mapSpeedRotation(walkerRef.current.absSpeed)
      if (walkerRef.current.direction === 'right' || walkerRef.current.direction === 'left') {
        gsap.to(ref.current.rotation, {
          y: walkerRef.current.direction === 'right' ? `+=${count * Math.PI}` : `-=${count * Math.PI}`,
          ease: "elastic.out",
          delay: 0.03,
          // stagger: 2,
          duration,
          onComplete: () => {
            setNear(prev => ({ ...prev, near: false }))
            if (nearSynth) nearSynth.dispose()
            // If this is a red tile (i.e a tile that needs to be flipped in order to win) -> then we increment!
            //onComplete(value => value + 1);
          },
        });
      }
      if (walkerRef.current.direction === 'up' || walkerRef.current.direction === 'down') {
        gsap.to(ref.current.rotation, {
          x: walkerRef.current.direction === 'down' ? `+=${count * Math.PI}` : `-=${count * Math.PI}`,
          ease: "elastic.out",
          delay: 0.03,
          // stagger: 2,
          duration,
          onComplete: () => {
            setNear(prev => ({ ...prev, near: false }))
            if (nearSynth) nearSynth.dispose()
            // If this is a red tile (i.e a tile that needs to be flipped in order to win) -> then we increment!
            //onComplete(value => value + 1);
          },
        });
      }
    }
  }, [near.near])
  return (
    <mesh
      ref={ref}
      position={position}
      scale={scale}
      visible={visible}
    // onClick={() => {
    //   ITP.push(idx)
    //   console.log(ITP)
    //   setColor('black')
    // }}
    >
      <boxGeometry />
      <meshStandardMaterial color={color} transparent={true} opacity={near.hover ? 0.5 : 1} />
    </mesh>
  )
})


const Walker = forwardRef(function (props, ref) {
  return (
    <mesh ref={ref} position={ref.current ? ref.current.position : [0, 0, 0]} scale={[0.2, 0.2, 0.2]} visible={false}>
      <sphereGeometry />
      <meshNormalMaterial />
    </mesh>
  );
})


