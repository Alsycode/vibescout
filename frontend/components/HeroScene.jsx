'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

export default function HeroScene() {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const scrollProgress = useRef(0)
  const phase1Ref = useRef(null)
  const phase2Ref = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (rendererRef.current) return // StrictMode guard

    const isMobile = window.innerWidth < 768

    // ─── RENDERER ─────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.8
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x060912)
    rendererRef.current = renderer

    // ─── SCENE & CAMERA ───────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000)
    if (isMobile) {
      camera.position.set(0, 80, 160)
    } else {
      camera.position.set(0, 120, 200)
    }
    camera.lookAt(0, 20, 0)

    // ─── LIGHTING ─────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a0f1e, 0.3))
    const dirLight = new THREE.DirectionalLight(0x1a2535, 0.4)
    dirLight.position.set(-100, 200, 100)
    scene.add(dirLight)
    scene.add(new THREE.HemisphereLight(0x0a1428, 0x050810, 0.5))

    // ─── CITY BUILDINGS (3 draw calls via InstancedMesh) ──────────────
    const boxGeo = new THREE.BoxGeometry(1, 1, 1)
    const rand = (min, max) => min + Math.random() * (max - min)

    const bCounts = isMobile ? { a: 30, b: 30, c: 20 } : { a: 80, b: 80, c: 40 }

    const dummy = new THREE.Object3D()
    const setInstance = (mesh, i, x, sy, z, sx, sz) => {
      dummy.position.set(x, sy / 2, z)
      dummy.scale.set(sx, sy, sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    // Zone A — background
    const matA = new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 1, metalness: 0 })
    const meshA = new THREE.InstancedMesh(boxGeo, matA, bCounts.a)
    meshA.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    for (let i = 0; i < bCounts.a; i++) {
      const x = rand(-300, 300), z = rand(-400, -150)
      const sy = rand(15, 45), sx = rand(8, 18), sz = rand(8, 18)
      setInstance(meshA, i, x, sy, z, sx, sz)
      meshA.setColorAt(i, new THREE.Color(0x0a0c12).multiplyScalar(0.9 + Math.random() * 0.2))
    }
    meshA.instanceMatrix.needsUpdate = true
    meshA.instanceColor.needsUpdate = true
    scene.add(meshA)

    // Zone B — mid (clear zone for tower: abs(x)<22 && abs(z+80)<22)
    const matB = new THREE.MeshStandardMaterial({ color: 0x0d1018, roughness: 1, metalness: 0 })
    const meshB = new THREE.InstancedMesh(boxGeo, matB, bCounts.b)
    meshB.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    let placedB = 0, tries = 0
    while (placedB < bCounts.b && tries < bCounts.b * 12) {
      tries++
      const x = rand(-250, 250), z = rand(-150, -20)
      if (Math.abs(x) < 22 && Math.abs(z + 80) < 22) continue
      const sy = rand(20, 60), sx = rand(10, 22), sz = rand(10, 22)
      setInstance(meshB, placedB, x, sy, z, sx, sz)
      meshB.setColorAt(placedB, new THREE.Color(0x0d1018).multiplyScalar(0.9 + Math.random() * 0.2))
      placedB++
    }
    meshB.instanceMatrix.needsUpdate = true
    meshB.instanceColor.needsUpdate = true
    scene.add(meshB)

    // Zone C — foreground
    const matC = new THREE.MeshStandardMaterial({ color: 0x111520, roughness: 1, metalness: 0 })
    const meshC = new THREE.InstancedMesh(boxGeo, matC, bCounts.c)
    meshC.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    for (let i = 0; i < bCounts.c; i++) {
      const x = rand(-200, 200), z = rand(-20, 80)
      const sy = rand(10, 35), sx = rand(8, 16), sz = rand(8, 16)
      setInstance(meshC, i, x, sy, z, sx, sz)
      meshC.setColorAt(i, new THREE.Color(0x111520).multiplyScalar(0.9 + Math.random() * 0.2))
    }
    meshC.instanceMatrix.needsUpdate = true
    meshC.instanceColor.needsUpdate = true
    scene.add(meshC)

    // ─── CENTRAL TOWER ────────────────────────────────────────────────
    const towerGeo = new THREE.BoxGeometry(16, 70, 16)
    const towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.85,
      metalness: 0.15,
      emissive: new THREE.Color(0x1a1200),
      emissiveIntensity: 0,
    })
    const towerMesh = new THREE.Mesh(towerGeo, towerMaterial)
    towerMesh.position.set(0, 35, -80)
    scene.add(towerMesh)

    // 12 windows: 4 rows × 3 cols on front face (z = -71.5)
    const litSet = new Set([1, 4, 7, 10])
    const windowGeos = []
    const windowMats = []
    const pointLights = []

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col
        const isLit = litSet.has(idx)
        const wGeo = new THREE.PlaneGeometry(2.2, 1.4)
        const wMat = new THREE.MeshBasicMaterial({ color: isLit ? 0xe8a245 : 0x080a0f })
        const wMesh = new THREE.Mesh(wGeo, wMat)
        wMesh.position.set([-4, 0, 4][col], 15 + row * 14, -71.5)
        scene.add(wMesh)
        windowGeos.push(wGeo)
        windowMats.push(wMat)

        if (isLit) {
          const pl = new THREE.PointLight(0xe8a245, 0.8, 25, 2)
          pl.position.set([-4, 0, 4][col], 15 + row * 14, -70)
          pl.castShadow = false
          scene.add(pl)
          pointLights.push(pl)
        }
      }
    }

    // ─── ATMOSPHERE ───────────────────────────────────────────────────
    // Ground fog — radial ShaderMaterial
    const fogGeo = new THREE.PlaneGeometry(600, 600)
    const fogMaterial = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1.0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        void main() {
          float dist = length(vUv - vec2(0.5));
          float alpha = smoothstep(0.5, 0.05, dist) * 0.85 * uOpacity;
          gl_FragColor = vec4(0.059, 0.082, 0.125, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const fogPlane = new THREE.Mesh(fogGeo, fogMaterial)
    fogPlane.rotation.x = -Math.PI / 2
    fogPlane.position.y = 1
    scene.add(fogPlane)

    // Haze planes
    const hazeGeos = []
    const hazeMats = []
    ;[
      { y: 30, opacity: 0.15 },
      { y: 60, opacity: 0.10 },
      { y: 90, opacity: 0.06 },
    ].forEach(({ y, opacity }) => {
      const hGeo = new THREE.PlaneGeometry(700, 700)
      const hMat = new THREE.MeshBasicMaterial({
        color: 0x0a1428,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const hMesh = new THREE.Mesh(hGeo, hMat)
      hMesh.rotation.x = -Math.PI / 2
      hMesh.position.y = y
      scene.add(hMesh)
      hazeGeos.push(hGeo)
      hazeMats.push(hMat)
    })

    // ─── PARTICLES ────────────────────────────────────────────────────
    const pCount = isMobile ? 1500 : 5000
    const pPositions = new Float32Array(pCount * 3)
    const pColors = new Float32Array(pCount * 3)
    const pSizes = new Float32Array(pCount)
    const pData = []

    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3]     = (Math.random() - 0.5) * 600
      pPositions[i * 3 + 1] = Math.random() * 80 + 2
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 500 - 150
      // #00D4B8 → rgb(0, 0.831, 0.722)
      pColors[i * 3]     = 0
      pColors[i * 3 + 1] = 0.831
      pColors[i * 3 + 2] = 0.722
      pSizes[i] = rand(0.3, 0.8)
      pData.push({ speed: rand(0.02, 0.08), phase: rand(0, Math.PI * 2) })
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3))
    particleGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1))

    const particleMat = new THREE.PointsMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      size: 0.5,
      sizeAttenuation: true,
      depthWrite: false,
    })
    const particlePoints = new THREE.Points(particleGeo, particleMat)
    scene.add(particlePoints)

    const towerTarget = new THREE.Vector3(0, 35, -80)

    // ─── ACOUSTIC RINGS ───────────────────────────────────────────────
    const ringDefs = [
      { r: 25,  tube: 0.15 },
      { r: 55,  tube: 0.12 },
      { r: 95,  tube: 0.10 },
      { r: 145, tube: 0.08 },
    ]
    const ringCount = isMobile ? 2 : 4
    const rings = []
    const ringMats = []

    ringDefs.slice(0, ringCount).forEach(({ r, tube }) => {
      const rGeo = new THREE.TorusGeometry(r, tube, 8, 64)
      const rMat = new THREE.MeshBasicMaterial({
        color: 0x4a7fe8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const rMesh = new THREE.Mesh(rGeo, rMat)
      rMesh.position.set(0, 2, -80)
      rMesh.rotation.x = -Math.PI / 2
      scene.add(rMesh)
      rings.push(rMesh)
      ringMats.push(rMat)
    })

    // ─── SOLAR GRADIENT ───────────────────────────────────────────────
    const solarGeo = new THREE.PlaneGeometry(20, 40)
    const solarMaterial = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0.0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        void main() {
          float strength = pow((1.0 - vUv.x) * vUv.y, 1.5);
          gl_FragColor = vec4(0.941, 0.627, 0.188, strength * 0.4 * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const solarPlane = new THREE.Mesh(solarGeo, solarMaterial)
    solarPlane.position.set(-8, 55, -71.5)
    scene.add(solarPlane)

    // ─── TOWER GLOW SPRITE ────────────────────────────────────────────
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = 128
    glowCanvas.height = 128
    const glowCtx = glowCanvas.getContext('2d')
    const radial = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64)
    radial.addColorStop(0,   'rgba(245,200,66,0.8)')
    radial.addColorStop(0.4, 'rgba(245,200,66,0.2)')
    radial.addColorStop(1.0, 'rgba(245,200,66,0)')
    glowCtx.fillStyle = radial
    glowCtx.fillRect(0, 0, 128, 128)
    const glowTex = new THREE.CanvasTexture(glowCanvas)

    const spriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.scale.set(60, 120, 1)
    sprite.position.set(0, 35, -79)
    scene.add(sprite)

    // ─── SCROLL SYSTEM ────────────────────────────────────────────────
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis()
    const lenisRaf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(lenisRaf)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.create({
      trigger: '#hero-section',
      start: 'top top',
      end: '+=300%',
      pin: true,
      scrub: 1.5,
      onUpdate: (self) => { scrollProgress.current = self.progress },
    })

    // ─── HELPERS ──────────────────────────────────────────────────────
    const lerp = (a, b, t) => a + (b - a) * t
    const mapRange = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c)
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
    const mapC = (v, a, b, c, d) => clamp(mapRange(v, a, b, c, d), Math.min(c, d), Math.max(c, d))

    // ─── ANIMATION LOOP ───────────────────────────────────────────────
    const clock = new THREE.Clock()
    let rafId
    let curParticleOpacity = 0
    let curSpriteOpacity = 0
    let curSolarOpacity = 0
    let curEmissive = 0
    const curRingOpacity = [0, 0, 0, 0]

    function animate() {
      rafId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      const p = scrollProgress.current

      // Fog pulse
      fogMaterial.uniforms.uOpacity.value = 0.9 + Math.sin(elapsed * 0.3) * 0.1

      // Particles — drift toward tower
      const posArr = particleGeo.attributes.position.array
      for (let i = 0; i < pCount; i++) {
        let px = posArr[i * 3], py = posArr[i * 3 + 1], pz = posArr[i * 3 + 2]

        const dx = towerTarget.x - px
        const dy = towerTarget.y - py
        const dz = towerTarget.z - pz
        const invLen = 1 / (Math.sqrt(dx * dx + dy * dy + dz * dz) || 1)
        const s = pData[i].speed
        px += dx * invLen * s
        py += dy * invLen * s
        pz += dz * invLen * s

        px += Math.sin(elapsed + pData[i].phase) * 0.05
        py += Math.cos(elapsed * 0.7 + pData[i].phase) * 0.03

        if (Math.hypot(px, py - 35, pz + 80) < 8) {
          px = (Math.random() - 0.5) * 600
          py = Math.random() * 80 + 2
          pz = (Math.random() - 0.5) * 500 - 150
        }

        posArr[i * 3] = px; posArr[i * 3 + 1] = py; posArr[i * 3 + 2] = pz
      }
      particleGeo.attributes.position.needsUpdate = true

      // Particle opacity
      let targetPO = 0
      if (p >= 0.20 && p < 0.40) targetPO = mapRange(p, 0.20, 0.40, 0, 0.55)
      else if (p >= 0.40 && p < 0.80) targetPO = 0.55
      else if (p >= 0.80) targetPO = mapRange(p, 0.80, 1.00, 0.55, 0.25)
      curParticleOpacity = lerp(curParticleOpacity, targetPO, 0.05)
      particleMat.opacity = curParticleOpacity

      // Acoustic rings
      const ringTargets = [
        mapC(p, 0.35, 0.45, 0, 0.35),
        mapC(p, 0.42, 0.52, 0, 0.28),
        mapC(p, 0.49, 0.59, 0, 0.22),
        mapC(p, 0.56, 0.66, 0, 0.16),
      ]
      rings.forEach((ring, i) => {
        ring.scale.setScalar(1 + Math.sin(elapsed * 0.3 + i * 1.2) * 0.008)
        curRingOpacity[i] = lerp(curRingOpacity[i], ringTargets[i], 0.05)
        ringMats[i].opacity = curRingOpacity[i]
      })

      // Solar gradient
      curSolarOpacity = lerp(curSolarOpacity, mapC(p, 0.55, 0.75, 0, 1), 0.05)
      solarMaterial.uniforms.uOpacity.value = curSolarOpacity

      // Tower glow sprite
      curSpriteOpacity = lerp(curSpriteOpacity, mapC(p, 0.70, 0.90, 0, 0.12), 0.05)
      spriteMat.opacity = curSpriteOpacity

      // Tower emissive
      curEmissive = lerp(curEmissive, mapC(p, 0.70, 0.90, 0, 0.3), 0.05)
      towerMaterial.emissiveIntensity = curEmissive

      // Camera — idle drift + scroll push
      camera.position.x += Math.sin(elapsed * 0.05) * 0.008
      camera.position.y += Math.sin(elapsed * 0.03) * 0.005
      camera.position.z = lerp(camera.position.z, lerp(200, 160, p), 0.02)
      camera.lookAt(0, 20, 0)

      // Text overlays — direct DOM, no setState
      const p1o = 1 - clamp(mapRange(p, 0.50, 0.65, 0, 1), 0, 1)
      if (phase1Ref.current) phase1Ref.current.style.opacity = p1o

      const p2o = clamp(mapRange(p, 0.85, 0.95, 0, 1), 0, 1)
      if (phase2Ref.current) phase2Ref.current.style.opacity = p2o

      renderer.render(scene, camera)
    }
    animate()

    // ─── RESIZE ───────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ─── CLEANUP ──────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      lenis.destroy()
      gsap.ticker.remove(lenisRaf)

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      glowTex.dispose()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  return (
    <section
      id="hero-section"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#060912',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Phase 1 — visible at scroll start, fades at p 0.50–0.65 */}
      <div
        ref={phase1Ref}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
          textAlign: 'center',
          padding: '0 24px',
          opacity: 1,
        }}
      >
        <p
          style={{
            fontSize: '11px',
            letterSpacing: '0.3em',
            color: '#4A7FE8',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontWeight: 400,
          }}
        >
          Environmental Intelligence
        </p>
        <h1
          style={{
            fontSize: 'clamp(48px,8vw,96px)',
            fontWeight: 300,
            color: '#E8EAF0',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '20px',
            margin: '0 0 20px',
          }}
        >
          The city knows
        </h1>
        <p
          style={{
            fontSize: 'clamp(16px,2vw,22px)',
            color: '#6B7280',
            fontWeight: 300,
            marginBottom: '36px',
          }}
        >
          Before you choose where to live.
        </p>
        <button
          onClick={() => router.push('/analyze')}
          style={{
            border: '1px solid rgba(232,162,69,0.4)',
            color: '#E8A245',
            background: 'transparent',
            padding: '14px 32px',
            letterSpacing: '0.1em',
            fontSize: '12px',
            cursor: 'pointer',
            pointerEvents: 'auto',
            fontFamily: 'inherit',
          }}
        >
          Audit any property →
        </button>
      </div>

      {/* Phase 2 — appears at p 0.85–0.95 */}
      <div
        ref={phase2Ref}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
          opacity: 0,
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(48px,8vw,96px)',
            fontWeight: 300,
            color: '#E8EAF0',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Your environment. Understood.
        </h2>
      </div>
    </section>
  )
}
