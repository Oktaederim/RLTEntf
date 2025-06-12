document.getElementById("calcForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const t_out = parseFloat(document.getElementById("t_out").value);
  const rh_out = parseFloat(document.getElementById("rh_out").value);
  const t_supply = parseFloat(document.getElementById("t_supply").value);
  const rh_supply = parseFloat(document.getElementById("rh_supply").value);
  const v_air = parseFloat(document.getElementById("v_air").value);

  const rho_air = 1.2; // kg/m³
  const m_air = rho_air * v_air; // kg/h

  const x_out = calcAbsFeuchte(t_out, rh_out); // g/kg
  const x_supply = calcAbsFeuchte(t_supply, rh_supply); // g/kg

  const t_kühl = 12; // angenommene Temperatur nach Kühler
  const x_kühl = x_supply; // Entfeuchtung bis zur Soll-Feuchte
  const h_out = calcEnthalpie(t_out, x_out);
  const h_kühl = calcEnthalpie(t_kühl, x_kühl);
  const h_supply = calcEnthalpie(t_supply, x_supply);

  const delta_x = x_out - x_supply; // g/kg
  const m_wasser_kühler = m_air * (delta_x / 1000); // kg/h

  const q_kühl = m_air * (h_out - h_kühl) / 3600; // kW
  const q_nacherh = m_air * (h_supply - h_kühl) / 3600; // kW

  const c_water = 4.18;
  const dt_kühl = 5;  // 8/13
  const dt_heiz = 20; // 70/50
  const v_wasser_kühler = q_kühl * 3600 / (c_water * dt_kühl * 1000); // m³/h
  const v_wasser_heizung = q_nacherh * 3600 / (c_water * dt_heiz * 1000); // m³/h

  const output = `
💨 Außenluft:
- Temperatur: ${t_out.toFixed(1)} °C
- Relative Feuchte: ${rh_out.toFixed(1)} %
- Absolute Feuchte: ${x_out.toFixed(2)} g/kg

💨 Zuluft (nach Erwärmung):
- Temperatur: ${t_supply.toFixed(1)} °C
- Relative Feuchte: ${rh_supply.toFixed(1)} %
- Absolute Feuchte: ${x_supply.toFixed(2)} g/kg

🔁 Luftstrom:
- Volumenstrom: ${v_air.toFixed(0)} m³/h
- Massenstrom: ${m_air.toFixed(0)} kg/h

💧 Entfeuchtung durch Kühler:
- Feuchtedifferenz: ${delta_x.toFixed(2)} g/kg
- Kondensatmenge: ${m_wasser_kühler.toFixed(2)} kg/h
- Kälteleistung: ${q_kühl.toFixed(2)} kW
- Wasser-Volumenstrom (bei 8/13 °C): ${v_wasser_kühler.toFixed(2)} m³/h

🔥 Erwärmer (Nacherhitzung auf Raumtemperatur):
- Temperaturerhöhung: ${(t_supply - t_kühl).toFixed(1)} K
- Heizleistung: ${q_nacherh.toFixed(2)} kW
- Wasser-Volumenstrom (bei 70/50 °C): ${v_wasser_heizung.toFixed(2)} m³/h
`;

  document.getElementById("output").textContent = output;

  // h-x-Diagramm mit 3 Zuständen
  updateChart(
    [x_out, x_kühl, x_supply],
    [t_out, t_kühl, t_supply]
  );
});

// Hilfsfunktionen

function calcAbsFeuchte(temp, rh) {
  const p_sat = 6.1078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const p_dampf = rh / 100 * p_sat;
  const x = 622 * (p_dampf / (1013 - p_dampf));
  return x;
}

function calcEnthalpie(temp, x) {
  return 1.005 * temp + (x / 1000) * (2501 + 1.86 * temp);
}

let chart;
function updateChart(xVals, tVals) {
  const ctx = document.getElementById('hxChart').getContext('2d');
  const dataPoints = xVals.map((x, i) => ({ x: x, y: tVals[i] }));

  const data = {
    datasets: [{
      label: 'Zustandsänderung',
      data: dataPoints,
      borderColor: 'blue',
      backgroundColor: 'lightblue',
      tension: 0.3,
      pointRadius: 6
    }]
  };

  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'h-x-Diagramm: Außenluft → Entfeuchtung → Erwärmung'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Absolute Feuchte x [g/kg]'
          },
          min: 0,
          max: 30
        },
        y: {
          title: {
            display: true,
            text: 'Temperatur [°C]'
          },
          min: 0,
          max: 40
        }
      }
    }
  };

  if (chart) {
    chart.data = data;
    chart.update();
  } else {
    chart = new Chart(ctx, config);
  }
}
