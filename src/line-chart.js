import * as array from 'd3-array'
import * as scale from 'd3-scale'
import * as shape from 'd3-shape'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { View, PanResponder } from 'react-native'
import Svg, { Defs, G, ClipPath, Rect } from 'react-native-svg'
import Path from './animated-path'
import { Constants } from './util'
import Grid from './grid'

class LineChart extends PureComponent {

    state = {
        width: 0,
        height: 0,
    }

    componentWillMount() {
        this._panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderGrant: () => {
                console.log('-------onPanResponderGrant------')
            },
            onPanResponderMove: (evt, gs) => {
                // let index = Math.round((evt.nativeEvent.locationX - 40)/(this.state.width)*this.props.dataPoints.length)
                // let index = Math.round(evt.nativeEvent.locationY/((this.state.height - evt.nativeEvent.locationY)/210));

                // let t = this.state.height;
                // let v = 210 - 50;
                // let ratio = v/t;
                // let yValue = ((this.state.height - evt.nativeEvent.locationY) * ratio) + 50;

                // let t = this.state.height - this.props.contentInset.bottom - this.props.contentInset.top;
                // let v = Math.max(...this.props.dataPoints) - Math.min(...this.props.dataPoints);
                // let ratio = v/t;
                // let yValue = ((t - (evt.nativeEvent.locationY - this.props.contentInset.top)) * ratio) + Math.min(...this.props.dataPoints);
                
                // if((evt.nativeEvent.locationY <= this.state.height - this.props.contentInset.bottom) && (evt.nativeEvent.locationY >= this.props.contentInset.top)) {
                //     this.props.renderTooltip({x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY, value: yValue});
                // }
                // if(yValue > 110) {
                //     this.props.renderTooltip({x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY, value: yValue});
                // }
                // else {
                //     this.props.renderTooltip({x: null, y: null, value: null});  
                // }
                // console.log('[MOVE] : y === ' + this.y(yValue) + ' && v === ' + v + ' && gs.moveY === ' + evt.nativeEvent.locationY + ' && value === ' + yValue + ' && this.state.height === ' + this.state.height + ' && this.props.contentInset.bottom === ' + this.props.contentInset.bottom + ' && this.props.contentInset.top === ' + this.props.contentInset.top)

                let count = this.props.dataPoints.length - 1
                let inset = this.props.contentInset.left
                let index = Math.round((evt.nativeEvent.locationX - inset)/(this.state.width - inset)*count)

                let val = this.props.dataPoints[index]
                let xPos = this.x(index)
                let yPos = this.y(val)

                // console.log('[MOVE] : index ==== ' + index + ' && total width ==== ' + this.state.width + ' && total count ==== ' + this.props.dataPoints.length);
                console.log('[MOVE] : xValue ==== ' + xPos + ' && yValue ==== ' + yPos);
                this.props.renderTooltip({x: xPos, y: yPos, value: val});
                // console.log('[MOVE] : gs.moveX ==== ' + evt.nativeEvent.locationX + ' && gs.moveY ==== ' + evt.nativeEvent.locationY + '\n');
            },
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderRelease: (evt, gs) => {
                console.log('[RELEASE] : gs.moveX === ' + evt.nativeEvent.locationX + ' && gs.moveY === ' + evt.nativeEvent.locationY)
            //   this.setState({x: 0, y: 0})
            },
            onShouldBlockNativeResponder: (evt, gestureState) => {
              // Returns whether this component should block native components from becoming
              // the JS responder. Returns true by default. Is currently only supported on
              // android.
              return true;
            }
          })
    }

    _onLayout(event) {
        const { nativeEvent: { layout: { height, width } } } = event
        this.setState({ height, width })
    }

    _createLine(dataPoints, yAccessor, xAccessor) {
        const { curve } = this.props

        return shape.line()
            .x(xAccessor)
            .y(yAccessor)
            .defined(value => typeof value === 'number')
            .curve(curve)
            (dataPoints)
    }

    render() {

        const {
            dataPoints,
            yAxisValues,
            style,
            animate,
            animationDuration,
            showGrid,
            numberOfTicks,
            tickHeight,
            ticksColor,
            curve,
            contentInset: {
                top    = 0,
                bottom = 0,
                left   = 0,
                right  = 0,
            },
            gridMax,
            gridMin,
            renderDecorator,
            extras,
            renderExtra,
            shadowOffset,
            gridProps,
            svg,
            shadowSvg,
            renderGradient,
            renderDashLine,
            isFillTop,
            maximumValue,
            maximumColor,
        } = this.props

        const { width, height } = this.state

        if (dataPoints.length === 0) {
            return <View style={ style }/>
        }

        // const extent = array.extent([ ...dataPoints, gridMax, gridMin, -shadowOffset ])
        const extent = [ Math.min(...yAxisValues), Math.max(...yAxisValues) ]//array.extent([ ...dataPoints, Math.min(...dataPoints) ])
        const ticks  = yAxisValues //array.ticks(extent[ 0 ], extent[ 1 ], numberOfTicks)

        //invert range to support svg coordinate system
        const y = scale.scaleLinear()
            .domain(extent)
            .range([ height - bottom, top ])

        const x = scale.scaleLinear()
            .domain([ 0, dataPoints.length - 1 ])
            .range([ left, width - right ])

        this.y = y
        this.x = x

        const area = shape.area()
            .x((d, index) => x(index))
            .y0(y(0))
            .y1(d => y(d))
            .defined(value => typeof value === 'number')
            .curve(curve)
            (dataPoints)

        const line = this._createLine(
            dataPoints,
            value => y(value),
            (value, index) => x(index),
        )

        const shadow = this._createLine(
            dataPoints,
            value => y(value - shadowOffset),
            (value, index) => x(index),
        )

        return (
            <View style={style}>
                <View style={{ flex: 1 }} onLayout={event => this._onLayout(event)}>
                    <Svg style={{ flex: 1 }} {...this._panResponder.panHandlers}>
                        {
                            showGrid &&
                            <Grid
                                y={ y }
                                ticks={ ticks }
                                height={ tickHeight }
                                ticksColor={ ticksColor }
                                gridProps={ gridProps }
                            />
                        }
                        {
                            <Defs>
                                { renderGradient && renderGradient({ id: 'gradient', width, height, x, y }) }
                            </Defs>
                        }
                        {
                            isFillTop && <Defs key={ 'clips' }>
                                            <ClipPath id={ 'clip-path-top' }>
                                                <Rect x={ '0' } y={ `${-(this.state.height-this.y(maximumValue))}` } width={ this.state.width } height={ '100%' }/>
                                            </ClipPath>
                                            <ClipPath id={ 'clip-path-bottom' }>
                                                <Rect x={ '0' } y={ `${(this.y(80))}` } width={ this.state.width } height={ '100%' }/>
                                            </ClipPath>
                                        </Defs>
                        }
                        <G>
                            <Path
                                { ...svg }
                                d={ svg.isFill ? area : line }
                                stroke={svg.stroke}
                                fill={ svg.isFill ? svg.fill : 'none' }
                                animate={animate}
                                animationDuration={animationDuration}
                            />
                            { isFillTop && <Path
                                { ...svg }
                                d={ svg.isFill ? area : line }
                                stroke={svg.stroke}
                                fill={ maximumColor }
                                animate={animate}
                                animationDuration={animationDuration}
                                clipPath={'url(#clip-path-top)'}
                            /> }
                            {/* { isFillTop && <Path
                                { ...svg }
                                d={ svg.isFill ? area : line }
                                stroke={svg.stroke}
                                fill={ 'yellow' }
                                animate={animate}
                                animationDuration={animationDuration}
                                clipPath={'url(#clip-path-bottom)'}
                            /> } */}
                            {/* <Path
                                strokeWidth={ 5 }
                                { ...shadowSvg }
                                d={shadow}
                                fill={'none'}
                                animate={animate}
                                animationDuration={animationDuration}
                            /> */}
                            { renderDashLine() }
                            { dataPoints.map((value, index) => renderDecorator({ x, y, value, index })) }
                            { extras.map((item, index) => renderExtra({ x, y, item, index, width, height })) }
                        </G>
                    </Svg>
                </View>
            </View>
        )
    }
}

LineChart.propTypes = {
    dataPoints: PropTypes.arrayOf(PropTypes.number).isRequired,
    yAxisValues: PropTypes.arrayOf(PropTypes.number).isRequired,
    svg: PropTypes.object,
    shadowSvg: PropTypes.object,
    shadowWidth: PropTypes.number,
    shadowOffset: PropTypes.number,
    style: PropTypes.any,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    curve: PropTypes.func,
    contentInset: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
    }),
    numberOfTicks: PropTypes.number,
    tickHeight: PropTypes.number,
    ticksColor: PropTypes.arrayOf(PropTypes.string),
    showGrid: PropTypes.bool,
    gridMin: PropTypes.number,
    gridMax: PropTypes.number,
    extras: PropTypes.array,
    gridProps: PropTypes.object,
    renderDecorator: PropTypes.func,
    renderExtra: PropTypes.func,
    renderDashLine: PropTypes.func,
    renderGradient: PropTypes.func,
    renderTooltip: PropTypes.func,
    isFillTop: PropTypes.bool,
    maximumValue: PropTypes.number,
    maximumColor: PropTypes.string,
    ...Constants.gridProps,
}

LineChart.defaultProps = {
    svg: {},
    shadowSvg: {},
    shadowOffset: 3,
    width: 100,
    height: 100,
    curve: shape.curveCardinal,
    contentInset: {},
    numberOfTicks: 10,
    showGrid: true,
    gridMin: 0,
    gridMax: 0,
    extras: [],
    isFillTop: false,
    ...Constants.gridDefaultProps,
    renderDecorator: () => {
    },
    renderExtra: () => {
    },
    renderTooltip: () => {
    },
    renderDashLine: () => {
    },
}

export default LineChart

