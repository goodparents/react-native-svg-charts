import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { G, Line } from 'react-native-svg'

class Grid extends PureComponent {

    componentDidMount() {
        this.counter = -1;
    }

    _getIndex = () => {
      this.counter += 1;
      return this.counter;
    }

    render() {
        this.componentDidMount()
        const {
                  ticks,
                  y,
                  height,
                  ticksColor,
                  gridProps,
              } = this.props

        return (
            <G>
                {
                    ticks.map(tick => (
                        <Line
                            key={ tick }
                            x1={ '0%' }
                            x2={ '100%' }
                            y1={ y(tick) }
                            y2={ y(tick) }
                            strokeWidth={ height }
                            stroke={ 'transparent' }    //ticksColor[this._getIndex()]
                            { ...gridProps }
                        />
                    ))
                }
            </G>
        )
    }
}

Grid.propTypes = {
    y: PropTypes.func.isRequired,
    ticks: PropTypes.array.isRequired,
    height: PropTypes.number.isRequired,
    ticksColor: PropTypes.arrayOf(PropTypes.string),
    gridProps: PropTypes.object,
}

Grid.defaultProps = {
    gridProps: {},
}

export default Grid
