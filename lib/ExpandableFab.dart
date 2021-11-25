import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'util/ThemeStat.dart';
import 'package:provider/provider.dart';

@immutable
class ExpandableFab extends StatefulWidget {
  const ExpandableFab({
    Key? key,
    this.initialOpen,
    required this.distance,
    required this.children,
  }) : super(key: key);

  //这是什么？
  final bool? initialOpen;
  final double distance;
  final List<Widget> children;

  @override
  _ExpandableFabState createState() => _ExpandableFabState();
}

class _ExpandableFabState extends State<ExpandableFab>
    with SingleTickerProviderStateMixin {
  //add Key
  final expFabKey = GlobalKey();
  late final AnimationController _controller;
  late final Animation<double> _expandAnimation;
  bool _open = false;

  static final pixelRatio = window.devicePixelRatio;

//Size in logical pixels
  static final logicalScreenSize = window.physicalSize / pixelRatio;
  static final deviceWidth = logicalScreenSize.width;
  static final deviceHeight = logicalScreenSize.height;
  static const commonDuration = const Duration(milliseconds: 150);

  final ignoreingContainerOffsetX = -(deviceWidth * 0.2);
  final ignoreingContainerOffsetY = -(deviceHeight * 0.2);

  // 初始化overlayentry
  // late OverlayEntry overlayEntry;
  @override
  void initState() {
    super.initState();
    // overlayEntry = OverlayEntry(
    //     builder: (BuildContext context) {
    //       return Container();
    //     },
    //     opaque: true);

    _open = widget.initialOpen ?? false;
    _controller = AnimationController(
      value: _open ? 1.0 : 0.0,
      duration: commonDuration,
      vsync: this,
    );
    _expandAnimation = CurvedAnimation(
      curve: Curves.fastOutSlowIn,
      reverseCurve: Curves.easeOutQuad,
      parent: _controller,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _open = !_open;
      if (_open) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox.expand(
      child: Stack(
        alignment: Alignment.bottomRight,
        clipBehavior: Clip.none,
        children: [
          // _buildIgnoringBackground(),
          _buildIgnoreingContainer(),
          // _buildTapToCloseFab(),
          ..._buildExpandingActionButtons(),
          _buildTapToOpenFab(),
        ],
      ),
    );
  }

  List<Widget> _buildExpandingActionButtons() {
    final children = <Widget>[];
    final count = widget.children.length;
    final step = widget.distance / (count);
    for (var i = 0, widgetDistance = widget.distance;
        i < count;
        i++, widgetDistance -= step) {
      children.add(
        _ExpandingActionButton(
          maxDistance: widgetDistance,
          progress: _expandAnimation,
          child: widget.children[i],
        ),
      );
    }
    return children;
  }

  Widget _buildTapToOpenFab() {
    // print("_buildTapToOpenFab rebuild");
    return AnimatedContainer(
      transformAlignment: Alignment.center,
      transform: Transform.rotate(angle: !_open ? 0 : pi / 4).transform,
      // Matrix4.diagonal3Values(_open ? 0.7 : 1.2, _open ? 0.7 : 1.2, 1),
      duration: commonDuration,
      curve: const Interval(0.0, 1, curve: Curves.ease),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          minimumSize: Size(60, 60),
          shape: CircleBorder(),
        ),
        onPressed: _toggle,
        child: Icon(
          Icons.add,
          size: 40,
          color: Colors.white,
        ),
      ),
    );
  }

  Widget _buildIgnoreingContainer() {
    return AnimatedBuilder(
        animation: _expandAnimation,
        builder: (BuildContext context, Widget? child) {
          return AnimatedPositioned(
              top: _open ? ignoreingContainerOffsetY : 10,
              right: ignoreingContainerOffsetX,
              duration: commonDuration,
              child: AnimatedOpacity(
                  opacity: _expandAnimation.value,
                  duration: commonDuration,
                  child: IgnorePointer(
                      ignoring: !_open,
                      child: GestureDetector(
                        onTap: _toggle,
                        child: Consumer<ThemeState>(
                          builder: (context, themeState, child) => Container(
                            color: Color(0x0).withOpacity(0.9),
                            height: deviceHeight * 1.5,
                            width: deviceWidth * 1.5,
                            child: null,
                          ),
                        ),
                      ))));
        });
  }
}

@immutable
class _ExpandingActionButton extends StatelessWidget {
  const _ExpandingActionButton({
    Key? key,
    required this.maxDistance,
    required this.progress,
    required this.child,
  }) : super(key: key);

  final double maxDistance;
  final Animation<double> progress;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: progress,
      builder: (context, child) {
        final offset = Offset(
          0,
          progress.value * maxDistance,
        );
        return Positioned(
          right: 0,
          bottom: offset.dy,
          child: child!,
          // child: Transform.rotate(
          //   angle: (1.0 - progress.value) * math.pi / 2,
          //   child: child!,
          // ),
        );
      },
      child: FadeTransition(
        opacity: progress,
        child: child,
      ),
    );
  }
}

@immutable
class ActionButton extends StatelessWidget {
  const ActionButton({
    Key? key,
    this.onPressed,
    required this.icon,
    required this.iconSize,
    required this.text,
  }) : super(key: key);

  final VoidCallback? onPressed;
  final icon;
  final double iconSize;
  final text;

  @override
  Widget build(BuildContext context) {

    return Row(
      children: [
        Padding(
            padding: const EdgeInsets.fromLTRB(0, 0, 20, 0),
            child: RichText(
              text: TextSpan(
                  text: "$text", style: TextStyle(fontSize: iconSize * 0.8)),
            )),
        ElevatedButton(
          onPressed: onPressed,
          child: Icon(
            icon,
            size: iconSize + 0.0,
          ),
          style: ElevatedButton.styleFrom(
            minimumSize: Size(iconSize + 20, iconSize + 20),
            shape: CircleBorder(),
          ),
        ),
      ],
    );
  }
}
