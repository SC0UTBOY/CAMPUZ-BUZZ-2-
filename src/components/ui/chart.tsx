

"use client"

import * as React from "react"
import * as RechartsCore from "recharts"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsCore.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  // Security fix: Generate CSS safely without dangerouslySetInnerHTML
  const cssVariables = React.useMemo(() => {
    const styles: Record<string, string> = {}
    
    Object.entries(config).forEach(([key, itemConfig]) => {
      const cssVariable = `--color-${key}`
      
      if (itemConfig.theme) {
        // Handle theme-based colors
        Object.entries(itemConfig.theme).forEach(([theme, color]) => {
          const selector = THEMES[theme as keyof typeof THEMES]
          if (selector) {
            const fullSelector = selector ? `${selector} [data-chart="${chartId}"]` : `[data-chart="${chartId}"]`
            styles[fullSelector] = `${cssVariable}: ${color}`
          }
        })
      } else if (itemConfig.color) {
        // Handle direct colors - sanitize to prevent CSS injection
        const sanitizedColor = itemConfig.color.replace(/[^#a-zA-Z0-9\s\-().,]/g, '')
        styles[`[data-chart="${chartId}"]`] = `${cssVariable}: ${sanitizedColor}`
      }
    })
    
    return styles
  }, [config, chartId])

  // Apply styles via CSS custom properties instead of innerHTML
  React.useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.id = `chart-styles-${chartId}`
    
    const cssText = Object.entries(cssVariables)
      .map(([selector, rule]) => `${selector} { ${rule}; }`)
      .join('\n')
    
    styleElement.textContent = cssText
    document.head.appendChild(styleElement)
    
    return () => {
      const existingStyle = document.getElementById(`chart-styles-${chartId}`)
      if (existingStyle) {
        document.head.removeChild(existingStyle)
      }
    }
  }, [cssVariables, chartId])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={`flex aspect-video justify-center text-xs ${className || ''}`}
        {...props}
      >
        <RechartsCore.ResponsiveContainer>
          {children}
        </RechartsCore.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsCore.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsCore.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return labelFormatter(label, payload)
      }

      return value
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelKey,
      config,
    ])

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={`rounded-lg border bg-background p-2 shadow-sm ${className || ''}`}
      >
        <div className={labelClassName || ''}>
          {tooltipLabel ? (
            <div className="font-medium text-foreground">
              {tooltipLabel}
            </div>
          ) : null}
          <div className="grid gap-1.5">
            {payload.map((item, index) => {
              const key = `${nameKey || item.name || item.dataKey || "value"}`
              const itemConfig = getPayloadConfigFromPayload(config, item, key)
              const indicatorColor = color || item.payload?.fill || item.color

              return (
                <div
                  key={item.dataKey}
                  className={`flex w-full flex-wrap items-stretch gap-2 ${
                    indicator === "dot" ? "items-center" : "items-start"
                  }`}
                >
                  {formatter && (item.value || item.value === 0) ? (
                    formatter(item.value, item.name, item, index, item.payload)
                  ) : (
                    <>
                      {itemConfig?.icon ? (
                        <itemConfig.icon />
                      ) : (
                        !hideIndicator && (
                          <div
                            className={`shrink-0 rounded-[2px] ${
                              indicator === "dot"
                                ? "h-2.5 w-2.5"
                                : indicator === "line"
                                ? "w-1"
                                : indicator === "dashed"
                                ? "w-0 border-l-2 border-dashed"
                                : "w-1"
                            }`}
                            style={{
                              backgroundColor: indicatorColor,
                              borderColor: indicatorColor,
                            }}
                          />
                        )
                      )}
                      <div className="flex flex-1 justify-between leading-none">
                        <div className="grid gap-1.5">
                          <span className="text-muted-foreground">
                            {itemConfig?.label || item.name}
                          </span>
                        </div>
                        {(item.value || item.value === 0) && (
                          <span className="font-mono font-medium text-foreground">
                            {item.value}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsCore.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsCore.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={`flex items-center justify-center gap-4 ${className || ''}`}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={`flex items-center gap-1.5 ${
              item.type === "none" ? "items-center" : "items-start"
            }`}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span className="text-muted-foreground">
              {itemConfig?.label}
            </span>
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

// Helper to extract the payload configuration
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in config ||
    (payloadPayload && configLabelKey in payloadPayload)
  ) {
    return config[configLabelKey]
  }

  return config[key]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}

