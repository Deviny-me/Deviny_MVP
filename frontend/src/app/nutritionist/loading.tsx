import { Spinner } from '@/components/ui/Spinner'

export default function NutritionistLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <Spinner size="lg" color="nutritionist" />
    </div>
  )
}
