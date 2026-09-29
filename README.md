# Log 'n Load

Jogo de browser de entregas locais na Grande Vitória (ES), com loop estilo app de delivery.

## Loop do MVP

1. Defina sua localização (CEP, GPS, pin no mapa ou bairro)
2. Veja pedidos num raio de **2 km** (ETAs de 3–20 min de jogo)
3. Aceite → traço da rota encolhe até a entrega
4. Receba o pagamento e novos pedidos a partir do destino

Fretes entre cidades ficam para a próxima etapa.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · MapLibre GL · Zustand · localStorage
