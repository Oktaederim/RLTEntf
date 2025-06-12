document.getElementById("calcForm").addEventListener("submit", function(e) {
  e.preventDefault();

  // Eingabewerte holen
  const t_out = parseFloat(document.getElementById("t_out").value);
  const rh_out = parseFloat(document.getElementById("rh_out").value);
  const t_supply = parseFloat(document.getElementById("t_supply").value);
  const rh_supply = parseFloat(document.getElementById("rh_supply").value);
  const v_air = parseFloat(document.getElementById("v_air").value); // m³/h

  // Umrechnungen
  const rho_air = 1.2; // kg/m³ (vereinfachte Luftdichte)
  const m_air = rho_air * v_air; // kg/h

  const x_out = calcAbsFeuchte(t_out, rh_out); // g/kg
  const x_supply = calcAbsFeuchte(t_supply, rh_supply); // g/kg

  const delta_x = x_out - x_supply; // g/kg
  const m_wasser = m_air * (delta_x / 1000); // kg/h

  const h_out = calcEnthalpie(t_out, x_out); // kJ/kg
  const h_supply = calcEnthalpie(t_supply, x_supply); // kJ/kg

  const q_kühl = m_air * (h_out - h_supply) / 3600; // kW

  // Annahme: ΔT Wasser = 5K, spez. Wärmekapazität = 4.18 kJ/kgK
  const c_water = 4.18; // kJ/kgK
  const deltaT_water = 5; // K
  const m_water = q_kühl * 3600 / (c_water * deltaT_water * 1000); // m³/h (ca. mit ρ=1)

  // Ausgabe formatieren
  const output = `
Außenluft:
- Temperatur: ${t_out.toFixed(1)} °C
- Relative Feuchte: ${rh_out.toFixed(1)} %
- Absolute Feuchte: ${x_out.toFixed(2)} g/kg

Zuluft:
- Temperatur: ${t_supply.toFixed(1)} °C
- Relative Feuchte: ${rh_supply.toFixed(1)} %
- Absolute Feuchte: ${x_supply.toFixed(2)} g/kg

Luft:
- Volumenstrom: ${v_air.toFixed(0)} m³/h
- Massenstrom: ${m_air.toFixed(0)} kg/h

Entfeuchtung:
- Feuchtedifferenz: ${delta_x.toFixed(2)} g/kg
- Kondensatmenge: ${m_wasser.toFixed(2)} kg/h

Kühler:
- Kälteleistung: ${q_kühl.toFixed(2)} kW
- Wasser-Volumenstrom (bei 8/13 °C): ${m_water.toFixed(2)} m³/h
  `;

  document.getElementById("output").textContent = output;
});

function calcAbsFeuchte(temp, rh) {
  // Tetens-Formel (Sättigungsdampfdruck in hPa)
  const p_sat = 6.1078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const p_dampf = rh / 100 * p_sat;
  const x = 622 * (p_dampf / (1013 - p_dampf)); // g/kg
  return x;
}

function calcEnthalpie(temp, x) {
  // Enthalpie in kJ/kg
  return 1.005 * temp + x / 1000 * (2501 + 1.86 * temp);
}
