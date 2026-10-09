const towers = [
  { x: 265, y: 275, width: 92, depth: 46, height: 204, floors: 12 },
  { x: 377, y: 312, width: 74, depth: 38, height: 140, floors: 9 },
  { x: 182, y: 329, width: 66, depth: 35, height: 98, floors: 6 },
];

export function BuildingCircuit() {
  return (
    <svg className="building-circuit" viewBox="0 0 620 470" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tower-face" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#3a444c" />
          <stop offset="1" stopColor="#20262b" />
        </linearGradient>
        <linearGradient id="tower-side" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#1d2328" />
          <stop offset="1" stopColor="#303a42" />
        </linearGradient>
        <linearGradient id="site-floor" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#253038" />
          <stop offset="1" stopColor="#12171b" />
        </linearGradient>
      </defs>
      <g className="site-drawing">
        <path d="m65 324 260-118 225 110-260 123z" fill="url(#site-floor)" stroke="#51616c" />
        <path d="m65 324 0 12 225 110 260-123v-7M290 439v7" stroke="#3c4d59" />
        <path
          d="m82 333 255-119m-189 150 255-119m-190 151 255-119m-287-34 225 110M222 253l225 110M283 224l225 110"
          stroke="#637e8c"
          opacity="0.18"
        />
        {towers.map((tower) => (
          <g key={tower.x}>
            <path
              d={`M${tower.x} ${tower.y}v-${tower.height}l${tower.width} 44v${tower.height}z`}
              fill="url(#tower-face)"
              stroke="#71808a"
              strokeWidth="0.8"
            />
            <path
              d={`M${tower.x + tower.width} ${tower.y + 44}v-${tower.height}l${tower.depth} -23v${tower.height}z`}
              fill="url(#tower-side)"
              stroke="#71808a"
              strokeWidth="0.8"
            />
            <path
              d={`m${tower.x} ${tower.y - tower.height} ${tower.depth} -23 ${tower.width} 44-${tower.depth} 23z`}
              fill="#44515b"
              stroke="#86949b"
              strokeWidth="0.8"
            />
            {Array.from({ length: tower.floors }, (_, floor) => tower.y - 14 - floor * 15).map(
              (floorY) => (
                <g key={floorY} className="building-windows">
                  <path d={`m${tower.x + 9} ${floorY} ${tower.width - 18} 35`} strokeWidth="3" />
                  <path
                    d={`m${tower.x + tower.width + 7} ${floorY + 43} ${tower.depth - 14} -15`}
                    strokeWidth="2"
                  />
                </g>
              ),
            )}
            <path
              d={`m${tower.x + tower.width * 0.5} ${tower.y - tower.height + 5} 0 -15 16 -8`}
              stroke="#8e9da6"
            />
          </g>
        ))}
        <g className="house-drawing">
          <path d="m103 346 38-19 47 23v32l-38 18-47-23z" fill="#26333b" stroke="#71808a" />
          <path d="m103 346 15-25 39-18 31 47-38 18z" fill="#43525d" stroke="#87939c" />
          <path d="m118 362 11 5v13l-11-5zm20 10 12 6v12l-12-6" className="house-windows" />
          <path d="m164 371 10-5v15l-10 5z" fill="#445f70" />
        </g>
        <g className="site-power-lines" strokeWidth="2">
          <path d="M121 409 160 428 222 398 278 425 464 337" />
          <path d="m222 398 0-26 49-24v-41m7 118v-62l50-24v-26m83 49v-32l25-13" />
        </g>
        <g fill="#12191d" stroke="#738792">
          <circle cx="121" cy="409" r="5" />
          <circle cx="222" cy="398" r="5" />
          <circle cx="278" cy="425" r="5" />
          <circle cx="464" cy="337" r="5" />
        </g>
      </g>
      <g className="diagram-annotations" stroke="#617480" strokeWidth="0.6">
        <path d="M311 47h142l24 24M127 317H57l-16 16M464 336h106v-64" />
        <path d="M575 141v95m-4-95h8m-8 95h8" />
      </g>
      <g fill="#91a2ac" fontSize="9" fontFamily="monospace">
        <text x="377" y="38">
          INTELLIGENT BUILDINGS
        </text>
        <text x="10" y="350">
          01 / RESIDENTIAL
        </text>
        <text x="470" y="259">
          02 / DEVELOPMENT
        </text>
        <text x="312" y="462">
          POWER → CONTROL → CONNECTION
        </text>
      </g>
    </svg>
  );
}
