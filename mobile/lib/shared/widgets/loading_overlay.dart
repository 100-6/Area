import 'package:flutter/material.dart';

class LoadingOverlay extends StatelessWidget {
  final Widget child;
  final bool isLoading;
  final String loadingText;
  final bool useRobotGif;

  const LoadingOverlay({
    super.key,
    required this.child,
    required this.isLoading,
    this.loadingText = 'Chargement...',
    this.useRobotGif = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: Colors.black54,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (useRobotGif)
                    Image.asset(
                      'assets/images/happy-retro-robot.gif',
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return const CircularProgressIndicator();
                      },
                    )
                  else
                    const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    loadingText,
                    style: const TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}