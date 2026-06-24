import PhotoCapture from '../onboarding/PhotoCapture'
import InspirationCapture from '../onboarding/InspirationCapture'
import ShapeSelector from '../onboarding/ShapeSelector'
import StyleSelector from '../onboarding/StyleSelector'
import LengthSelector from '../onboarding/LengthSelector'
import Processing from '../onboarding/Processing'

export default function ManicureSelectionSteps({
  step,
  data,
  setData,
  goTo,
  onPhotoBack,
  onInspirationNext,
  onInspirationSkip,
  onLengthNext,
  processingFake = false,
  processingMessages,
  processingHint,
  onProcessingComplete,
}) {
  switch (step) {
    case 'photo':
      return (
        <PhotoCapture
          onNext={(photo) => {
            if (photo) setData((d) => ({ ...d, photo }))
            goTo('inspiration')
          }}
          onBack={onPhotoBack}
          onPhotoSelect={(photo) => setData((d) => ({ ...d, photo }))}
        />
      )
    case 'inspiration':
      return (
        <InspirationCapture
          onNext={onInspirationNext}
          onSkip={onInspirationSkip}
          onBack={() => goTo('photo')}
          onInspirationSelect={(inspirationPhoto) => setData((d) => ({ ...d, inspirationPhoto }))}
        />
      )
    case 'shape':
      return (
        <ShapeSelector
          onNext={() => goTo('style')}
          onBack={() => goTo('inspiration')}
          selected={data.shape}
          onSelect={(shape) => setData((d) => ({ ...d, shape }))}
        />
      )
    case 'style':
      return (
        <StyleSelector
          onNext={() => goTo('length')}
          onBack={() => goTo('shape')}
          selected={data.style}
          onSelect={(style) => setData((d) => ({
            ...d,
            style,
            inspirationPhoto: style !== 'nailart' ? null : d.inspirationPhoto,
          }))}
          customNote={data.customNote}
          onCustomNote={(customNote) => setData((d) => ({ ...d, customNote }))}
          inspirationPhoto={data.inspirationPhoto}
          onInspirationPhoto={(inspirationPhoto) => setData((d) => ({ ...d, inspirationPhoto }))}
        />
      )
    case 'length':
      return (
        <LengthSelector
          onNext={onLengthNext}
          onBack={() => goTo('style')}
          selected={data.length}
          onSelect={(length) => setData((d) => ({ ...d, length }))}
        />
      )
    case 'processing':
      return (
        <Processing
          fake={processingFake}
          messages={processingMessages}
          hint={processingHint}
          onComplete={onProcessingComplete}
        />
      )
    default:
      return null
  }
}
