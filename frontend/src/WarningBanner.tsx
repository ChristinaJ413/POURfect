interface WarningBannerProps {
  message: string
}

function WarningBanner({ message }: WarningBannerProps): JSX.Element {
  return <div className="warning-banner">{message}</div>
}

export default WarningBanner
