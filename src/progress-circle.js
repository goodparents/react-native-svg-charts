import React, { PureComponent } from 'react'
import { View } from 'react-native'
import PropTypes from 'prop-types'
import * as shape from 'd3-shape'
import Path from './animated-path'
import Svg, { Defs, Stop, G, LinearGradient } from 'react-native-svg'

class ProgressCircle extends PureComponent {

    state = {
        height: 0,
        width: 0,
    }

    _onLayout(event) {
        const { nativeEvent: { layout: { height, width } } } = event
        this.setState({ height, width })
    }

    render() {
        const {
                  style,
                  progressColor,
                  circleWidth,
                  startAngle,
                  endAngle,
                  animate,
                  isGradient,
                  gradientStart,
                  gradientEnd,
                  animateDuration,
              } = this.props

        let { progress } = this.props

        const { height, width } = this.state

        const outerDiameter = Math.min(width, height)

        if (!isFinite(progress) || isNaN(progress)) {
            progress = 0
        }

        const data = [
            {
                key: 'progress',
                value: progress,
                color: progressColor,
            },
            {
                key: 'rest',
                value: 1 - progress,
                color: 'transparent',
            },
        ]

        const pieSlices = shape
            .pie()
            .sort(null)
            .startAngle(startAngle)
            .endAngle(endAngle)
            (data.map(d => d.value))

        const arcs = pieSlices.map((slice, index) => (
            {
                ...data[ index ],
                ...slice,
                path: shape.arc()
                    .outerRadius(outerDiameter / 2)  // Radius of the pie
                    .innerRadius((outerDiameter / 2) - circleWidth)  // Inner radius: to create a donut or pie
                    .startAngle(slice.startAngle)
                    .endAngle(slice.endAngle)
                    .cornerRadius(45)
                    (),
            }
        ))

        return (
            <View
                style={style}
                onLayout={event => this._onLayout(event)}
            >
                <Svg style={{ flex: 1 }}>
                    <Defs>
                      { // Gradient color for Gauge.
                        pieSlices.map((slice, index) => {
                          if(index == 0) {
                            return(
                              <LinearGradient
                                id={'gradient' + index}
                                key={'gradient' + index}
                                x1={0}
                                y1={0}
                                x2={110}
                                y2={0}
                              >
                                <Stop offset="0%" stopColor={isGradient ? gradientStart : progressColor} />
                                <Stop offset="100%" stopColor={isGradient ? gradientEnd : progressColor} />
                              </LinearGradient>
                            )
                          }
                        })
                      // =======================
                    }
                    </Defs>
                    <G
                        x={width / 2}
                        y={height / 2}
                    >
                        {arcs.map((shape, index) => {
                            return (
                                <Path
                                    key={index}
                                    fill={'url(#gradient' + index + ')'}
                                    d={shape.path}
                                    onPress={() => console.log(shape)}
                                    animate={animate}
                                    animationDuration={animateDuration}
                                />
                            )
                        })}
                    </G>
                </Svg>
            </View>
        )
    }
}

ProgressCircle.propTypes = {
    progress: PropTypes.number.isRequired,
    style: PropTypes.any,
    progressColor: PropTypes.any,
    circleWidth: PropTypes.number,
    startAngle: PropTypes.number,
    endAngle: PropTypes.number,
    animate: PropTypes.bool,
    animateDuration: PropTypes.number,
    isGradient: PropTypes.bool,
    gradientStart: PropTypes.string,
    gradientEnd: PropTypes.string,
}

ProgressCircle.defaultProps = {
    progressColor: '#22B6B0',
    startAngle: 0,
    circleWidth: 5,
    endAngle: Math.PI * 2,
    isGradient: false,
}

export default ProgressCircle
