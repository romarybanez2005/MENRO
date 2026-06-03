export default function LoadingScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={`${fullScreen  ? 'fixed inset-0 z-50' : ''} flex items-center justify-center h-full w-full bg-white`}>
      <img 
        src="/src/assets/menro-logo.png" 
        alt="Menro Logo" 
        className="w-32 h-32 object-contain animate-pulse"
      />
    </div>
  )
}
