/**
 * Funció per generar valors amb distribució normal (Gaussiana)
 * @param {number} mean - Valor mitjà (on es concentren les dades)
 * @param {number} stdDev - Desviació estàndard (com de disperses estan)
 */
function randomNormal(mean, stdDev) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
}

const generateMockData = () => {
    const getRandomInRange = (min, max, decimals = 1) => 
        parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

    //Mitjana de 25°C amb desviació de 5°C per ser "regular"
    let temperature = randomNormal(25, 5);

    //SPIKE (30% de probabilitat de valor exagerat)
    const isSpike = Math.random() < 0.10; 
    if (isSpike) {
        // Generem un pic extrem
        temperature = Math.random() > 0.5 ? getRandomInRange(80, 100) : getRandomInRange(-30, -10);
    }

    //HUMITAT basada en la temperatura (Inversament proporcional)
    let humidity;
    if (temperature >= 35) {
        // Spike d'humitat si fa molta calor
        humidity = getRandomInRange(80, 1000); 
    } else {
        // Humitat normal gaussiana al voltant del 50%
        humidity = Math.max(0, Math.min(100, randomNormal(50, 15)));
    }

    //LLUM basada en temperatura
    let light = (temperature > 25) ? randomNormal(800, 100) : randomNormal(300, 50);
    light = Math.max(0, Math.min(1000, light)); // Limitem rangs

    const lat = getRandomInRange(41.3800, 41.4000, 4);
    const lon = getRandomInRange(2.1500, 2.1700, 4);

    return {
        peerId: 'emisor-arduino-1',
        timestamp: Date.now(),
        location: [lat, lon],  // Array para Map.jsx
        lat: lat,              // Compatibilidad
        lng: lon,              // Compatibilidad
        temperature: parseFloat(temperature.toFixed(1)),
        humidity: parseFloat(humidity.toFixed(1)),
        wind: parseFloat(Math.max(0, randomNormal(15, 10)).toFixed(1)),  // Number, no string
        light: parseFloat(light.toFixed(1)),
        airQuality: getRandomInRange(0, 100)
    };
};
module.exports = { generateMockData };
