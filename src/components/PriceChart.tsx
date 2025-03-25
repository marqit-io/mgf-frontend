export const PriceChartWidget = (params: { poolAddress: string }) => {
  return (
    <iframe height="100%" width="100%" id="geckoterminal-embed" title="GeckoTerminal Embed" src={`https://www.geckoterminal.com/solana/pools/${params.poolAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=price&resolution=15m`} allow="clipboard-write" allowFullScreen></iframe>
  )
};