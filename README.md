# 🥤 Coca-Cola Ecosystem

Combinación de **3 proyectos anteriores** + el demo de codimexa.com:
- **codimexa.com/demos/cocacola/index25.php**: ecosystem de 30 modelos 3D, MediaPipe Hands, mic meter
- **holasebas**: personaje 3D controlable con WASD/joystick
- **olamundial**: fondo degradado cyberpunk, estética rojo/negro
- **holapapa**: tipografías premium (Orbitron, Rajdhani)

## 🌐 URL en vivo

👉 **https://aguitech.github.io/holacoca/**

## 🎮 Features

- 📹 **Cámara** del usuario (mini preview abajo-izquierda)
- ✋ **MediaPipe Hands**: detecta manos levantadas y resalta modelos del lado opuesto
- 🎤 **Mic meter**: el volumen de tu voz hace crecer la barra lateral y escala los modelos
- 🤖 **20 modelos 3D** flotando con animaciones (RobotExpressive GLB)
- 🎭 **Personaje 3D central** (Sebas) con 10 animaciones del GLTF
- 🕹️ **Joystick dual** en mobile (movimiento + cámara)
- 🎨 **Fondo degradado cyberpunk** con scanlines
- 🔴 **Paleta Coca-Cola** (rojo/negro) + tipografía Orbitron

## 🎮 Controles

**Desktop**:
- `W A S D` → Mover a Sebas (WALK animation)
- `SHIFT` → Correr (RUN animation)
- `ESPACIO` → Saltar (JUMP animation con física)
- `R` → Reset posición
- Mouse → Mirar alrededor

**Mobile**:
- 🕹️ Joystick IZQ → WASD
- 🎮 Joystick DER → Cámara
- 🦘 JUMP (verde) → Saltar
- ↻ RESET (gris) → Reset

**Cámara (ambas plataformas)**:
- ✋ Mano IZQ arriba → modelos del lado izq
- ✋ Mano DER arriba → modelos del lado der
- ✋✋ Ambas manos → todos los modelos
- 🎤 Hablar/gritar → los modelos crecen y se mueven

## 🛠️ Stack

- A-Frame 1.6.0 + aframe-extras (animation-mixer)
- `<model-viewer>` de Google (ecosystem de robots)
- MediaPipe Hands (CDN)
- MediaPipe Camera Utils
- Web Audio API (analyser + frequency data)
- HTML5 + CSS3 (gradientes, animaciones)
- Vanilla JS (sin frameworks)
- Hosteado en GitHub Pages

## 📁 Estructura

```
holacoca/
├── README.md
├── index.html              (~22KB · todo inline: A-Frame + ecosystem + joystick)
├── joystick.css            (mobile UI)
├── joystick.js             (dual joystick)
├── personaje7/             (Sebas GLTF)
│   ├── perosnaje_001.gltf
│   ├── perosnaje_001.bin
│   └── Ch02_*.png
└── images/                 (gradient bg)
    ├── estadio_cyberpunk.png
    ├── fan_silhouette.png
    └── trofeo_energia.png
```

## 🔒 Privacidad

Cámara y micrófono se procesan **100% en el navegador**. No se transmite nada a ningún servidor. La página pide permiso explícito al usuario antes de activar.
