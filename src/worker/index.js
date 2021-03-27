import code from './source'

export default function WorkerFactory (options) {
  const blob = new Blob([code], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url, options)
  URL.revokeObjectURL(url)

  return worker 
}
