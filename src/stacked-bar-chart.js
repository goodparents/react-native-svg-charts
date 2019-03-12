import * as array from 'd3-array'
import * as scale from 'd3-scale'
import * as shape from 'd3-shape'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { View } from 'react-native'
import Svg, { Defs, G } from 'react-native-svg'
import Path from './animated-path'
import Grid from './grid'

class BarChart extends PureComponent {

    static extractDataPoints(data, keys, order = shape.stackOrderNone, offset = shape.stackOffsetNone) {
        const series = shape.stack()
            .keys(keys)
            .order(order)
            .offset(offset)
            (data)

        //double merge arrays to extract just the values
        return array.merge(array.merge(series))
    }

    state = {
        width: 0,
        height: 0,
    }

    _onLayout(event) {
        const { nativeEvent: { layout: { height, width } } } = event
        this.setState({ height, width })
    }

    render() {
        const {
                  data,
                  keys,
                  colors,
                  mixColors,
                  order,
                  offset,
                  spacing,
                  animate,
                  animationDuration,
                  style,
                  showGrid,
                  renderGradient,
                  numberOfTicks,
                  contentInset: {
                      top    = 0,
                      bottom = 0,
                      left   = 0,
                      right  = 0,
                  },
                  gridMax,
                  gridMin,
                  gridProps,
                  extras,
                  renderExtra,
              } = this.props

        const { height, width } = this.state

        if (data.length === 0) {
            return <View style={ style }/>
        }

        const series = shape.stack()
            .keys(keys)
            .order(order)
            .offset(offset)
            (data)

        //double merge arrays to extract just the values
        const values = array.merge(array.merge(series))

        const extent = array.extent([ ...values, gridMin, gridMax ])
        const ticks  = array.ticks(extent[ 0 ], extent[ 1 ], numberOfTicks)

        //invert range to support svg coordinate system
        const y = scale.scaleLinear()
            .domain(extent)
            .range([ height - bottom, top ])

        // use index as domain identifier instead of value since
        // domain must be same length as number of bars
        // same value can occur at several places in data
        // const x = scale.scaleBand()
        //     .domain(data.map((_, index) => index))
        //     .range([ left, width - right - (data.length * 0.15)])

        let areas, x;
        
        if(spacing > 0.0) {

            x = scale.scaleBand()
            .domain(data.map((_, index) => index))
            .range([ left, width - right - (data.length * 0.15)])

            areas = array.merge(series.map((serie, keyIndex) => {
                return serie.map((entry, entryIndex) => {
                    const path = shape.area()
                        .x((d, _index) => _index === 0 ? x(entryIndex) : x(entryIndex) - x.bandwidth() + (x.bandwidth() * spacing))
                        .y0(d => y(d[ 0 ]))
                        .y1(d => y(d[ 1 ]))
                        .defined(d => !isNaN(d[ 0 ]) && !isNaN(d[ 1 ]))
                        ([ entry, entry ])
    
                    return {
                        path,
                        color: mixColors.length == 0 ? colors[keyIndex] :  mixColors[entryIndex][keyIndex],
                    }
                })
            }))
        }
        else {
            x = scale.scaleBand()
            .domain(data.map((_, index) => index))
            .range([ left, width - right])

            areas = array.merge(series.map((serie, keyIndex) => {
                return serie.map((entry, entryIndex) => {
                    const path = shape.area()
                        .x((d, _index) => _index === 0 ? x(entryIndex) : x(entryIndex) - + x.bandwidth() - 0.15)
                        .y0(d => y(d[ 0 ]))
                        .y1(d => y(d[ 1 ]))
                        .defined(d => !isNaN(d[ 0 ]) && !isNaN(d[ 1 ]))
                        ([ entry, entry ])
    
                    return {
                        path,
                        color: mixColors.length == 0 ? colors[keyIndex] :  mixColors[entryIndex][keyIndex],
                    }
                })
            }))
        }

        return (
            <View style={ style }>
                <View
                    style={ { flex: 1 } }
                    onLayout={ event => this._onLayout(event) }
                >
                    <Svg style={ { flex: 1 } }>
                        {
                            showGrid &&
                            <Grid
                                y={ y }
                                ticks={ ticks }
                                gridProps={ gridProps }
                            />
                        }
                        {
                            areas.map((bar, index) => {
                                return (
                                    <G key={ index }>
                                        <Defs>
                                            {
                                                renderGradient && renderGradient({
                                                    id: 'gradient',
                                                    ...bar,
                                                })
                                            }
                                        </Defs>
                                        <Path
                                            fill={ bar.color }
                                            d={ bar.path }
                                            animate={ animate }
                                            animationDuration={ animationDuration }
                                        />
                                    </G>
                                )
                            })
                        }
                        { extras.map((item, index) => renderExtra({ item, x, y, index, width, height })) }
                    </Svg>
                </View>
            </View>
        )
    }
}

BarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    keys: PropTypes.arrayOf(PropTypes.string).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    mixColors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    offset: PropTypes.func,
    order: PropTypes.func,
    style: PropTypes.any,
    strokeColor: PropTypes.string,
    renderGradient: PropTypes.func,
    spacing: PropTypes.number,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    contentInset: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
    }),
    numberOfTicks: PropTypes.number,
    showGrid: PropTypes.bool,
    gridMin: PropTypes.number,
    gridMax: PropTypes.number,
    gridProps: PropTypes.object,
    extras: PropTypes.array,
    renderExtra: PropTypes.func,
}

BarChart.defaultProps = {
    spacing: 0.0,
    offset: shape.stackOffsetNone,
    order: shape.stackOrderNone,
    width: 100,
    height: 100,
    showZeroAxis: true,
    contentInset: {},
    numberOfTicks: 10,
    showGrid: true,
    gridMin: 0,
    gridMax: 0,
    extras: [],
    renderDecorator: () => {
    },
    renderExtra: () => {
    },
}

export default BarChart
