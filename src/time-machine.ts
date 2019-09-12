
class TimeMachine<T> {
  getState: () => T
  compareState: (lastState: T) => boolean
  reloadState: (savedState: T) => void
  savedState: (T & { frames: number })[] = []

  constructor (
    getState: () => T,
    compareState: (lastState: T) => boolean,
    reloadState: (savedState: T) => void
  ) {
    this.getState = getState
    this.compareState = compareState
    this.reloadState = reloadState
  }

  runTimeMachine () {
    const savedState = this.savedState[this.savedState.length - 1]

    if (savedState) {
      this.reloadState(savedState)

      savedState.frames -= 1
      if (savedState.frames <= 0) {
        this.savedState.pop()
      }
    }
  }

  saveState () {
    this.savedState.push({
      frames: 1,
      ...this.getState()
    } as any)
  }

  updateState () {
    if (!this.savedState.length) {
      this.saveState()
      return
    }

    const lastSavedState = this.savedState[this.savedState.length - 1]
    if (this.compareState(lastSavedState)) {
      this.saveState()
    } else {
      lastSavedState.frames += 1
    }
  }
}

export default TimeMachine
